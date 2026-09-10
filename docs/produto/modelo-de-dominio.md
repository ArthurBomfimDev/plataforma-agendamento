# Modelo de Domínio

> Fase de definição. **Não é código** — é especificação para implementação futura.
> Domínio em inglês (decisão 6). Data: 2026-09-03
> Destino: `docs/produto/modelo-de-dominio.md`
> Substitui integralmente o modelo esboçado pelo Gemini.

---

## 1. Visão geral

8 módulos, 17 entidades, 7 objetos de valor, 2 serviços de domínio.

| Módulo | Entidades |
|---|---|
| Identity | `User`, `RefreshToken` |
| Tenancy | `Business`, `BusinessMembership` |
| People | `Customer`, `Professional` |
| Catalog | `Category`, `Service`, `ServiceProfessional` |
| Availability | `WorkSchedule`, `ScheduleException`, `Holiday` |
| Scheduling | `Appointment`, `AppointmentEvent` |
| Reputation | `Review`, `ReviewReply` |
| Compliance | `ConsentRecord`, `SensitiveAccessLog` |

**Raízes de agregado:** `Business`, `Customer`, `Appointment`, `User`.
Tudo o mais pertence a uma dessas quatro.

---

## 2. Objetos de valor

| Objeto | Composição | Regra |
|---|---|---|
| `Money` | amount (decimal 10,2), currency ("BRL") | Nunca `float`. Nunca negativo |
| `TimeRange` | start, end (UTC) | `end > start`. Sabe responder `overlaps()` e `contains()` |
| `Duration` | minutes (int) | > 0 e ≤ 480 |
| `Slot` | start, end, professionalId, available | Efêmero — **nunca persistido** |
| `GeoPoint` | latitude, longitude | `geography(Point, 4326)` no PostGIS |
| `Email` / `PhoneNumber` | string normalizada | Validação e normalização na construção |
| `Rating` | value (int) | 1 a 5 |

**Decisão:** slot **não é tabela.** Slot é resultado de cálculo sobre jornada, exceções e agendamentos existentes. Materializar slots gera milhões de linhas mortas e um problema de invalidação a cada mudança de jornada.

---

## 3. Identity

### `User`
Identidade única da plataforma. Um `User` pode ser consumidor, membro de empresa, ou ambos.

| Atributo | Notas |
|---|---|
| `Id` | GUID v7 (ordenável, bom para índice) |
| `Email` | único global |
| `PasswordHash` | Argon2id |
| `PhoneNumber` | |
| `FullName` | |
| `EmailConfirmedAt` | nullable |
| `Status` | `Active` \| `Suspended` \| `Deleted` |
| `CreatedAt` / `UpdatedAt` | UTC |

**Comportamentos:** `ConfirmEmail()`, `ChangePassword()`, `Suspend()`, `RequestErasure()` (LGPD — anonimiza, não apaga o histórico de agendamento).

**Invariante:** e-mail único. `Deleted` nunca autentica.

---

## 4. Tenancy

### `Business` — raiz de agregado, é o tenant

| Atributo | Notas |
|---|---|
| `Id`, `Slug` | slug único, usado na URL pública |
| `LegalName`, `TradeName` | |
| `CategoryId` | vertical principal |
| `Description`, `PhotoUrls`, `LogoUrl` | |
| `Address` | logradouro, número, bairro, cidade, UF, CEP |
| `Location` | `GeoPoint` — geocodificado do CEP |
| `TimeZone` | IANA, ex. `America/Sao_Paulo` |
| `IsSensitiveCategory` | `true` para saúde — ativa o regime LGPD Art. 11 |
| `AcceptsInsurance` | **booleano meramente informativo**, sem lógica |
| **Política de agendamento** | |
| `AutoConfirm` | padrão `false` (aprovação manual) |
| `PendingExpirationHours` | padrão 12 |
| `MinLeadTimeHours` | padrão 2 |
| `BookingHorizonDays` | padrão 60 |
| `CancellationWindowHours` | padrão 24 |
| `OverflowToleranceMinutes` | padrão 0 — transbordo do expediente (§3.5) |
| `Status` | `Draft` \| `Active` \| `Suspended` |

**Comportamentos:** `Activate()` (exige ≥1 serviço, ≥1 profissional e ≥1 jornada), `UpdateSchedulingPolicy()`, `Suspend()`.

### `BusinessMembership`
Resolve a decisão 2.2: papel, não tipo de conta.

`UserId` · `BusinessId` · `Roles` (flags: `Owner`, `Professional`) · `InvitedAt` · `AcceptedAt` · `RevokedAt`

**Invariantes:** toda empresa tem ao menos um `Owner` ativo; um `User` tem no máximo uma associação ativa por empresa; um `User` com papel `Professional` tem no máximo **uma** associação ativa no total (decisão 2.3).

---

## 5. People

### `Customer`
Perfil de consumidor. Global, **fora do tenant** (decisão 2.5).

`UserId` (1:1) · `PhotoUrl` · `DefaultLocation` (`GeoPoint`, opcional) · `PreferredCity`

**Não existe** `Customer` por empresa. A relação empresa↔consumidor é derivada dos agendamentos.

### `Professional`
Perfil de execução, público.

`BusinessMembershipId` · `DisplayName` · `Specialty` · `Bio` · `PhotoUrl` · `Experience[]` · `Certifications[]` · `IsPubliclyVisible` · `PublicProfileConsentAt`

**Invariante:** `IsPubliclyVisible = true` exige `PublicProfileConsentAt` preenchido (decisão 2.7).

---

## 6. Catalog

### `Category`
Enumeração controlada. MVP: `Beleza`, `Saúde`. `RequiresSensitiveHandling` marca a segunda.

### `Service`

| Atributo | Notas |
|---|---|
| `BusinessId` | |
| `Name`, `Description`, `PhotoUrls` | |
| `Duration` | minutos de atendimento efetivo |
| `BufferBeforeMinutes` / `BufferAfterMinutes` | padrão 0 (§3.3) |
| `SlotStepMinutes` | granularidade **por serviço** (decisão 3.1), padrão 15 |
| `Price` | `Money` |
| `SuppliesNote` | texto livre — substitui o módulo de estoque |
| `IsActive` | |

**Ocupação total = `BufferBefore + Duration + BufferAfter`.** É esse intervalo que entra na constraint de exclusão, não a duração.

**Invariantes:** `SlotStep` ≤ `Duration`; serviço ativo exige ≥1 profissional habilitado; desativar não afeta agendamentos já marcados.

### `ServiceProfessional`
`ServiceId` · `ProfessionalId` · `PriceOverride` (nullable) · `DurationOverride` (nullable)

Permite "corte com o Ricardo custa R$ 70, com o Fernando R$ 50" sem duplicar o serviço.

---

## 7. Availability

### `WorkSchedule` — jornada recorrente
`ProfessionalId` · `DayOfWeek` · `StartTime` · `EndTime` · `EffectiveFrom` · `EffectiveTo` (nullable)

Múltiplas linhas por dia representam a pausa de almoço: 09:00–12:00 e 13:00–18:00. **Não existe campo de pausa** — a ausência de linha é a pausa. Um conceito a menos.

**Invariante:** duas linhas do mesmo profissional no mesmo dia não podem se sobrepor.

### `ScheduleException`
`ProfessionalId` · `Type` (`DayOff` \| `Vacation` \| `Block` \| `ExtraShift`) · `TimeRange` · `Reason`

`ExtraShift` **adiciona** disponibilidade (o sábado extra); os demais **subtraem**.

### `Holiday`
`Date` · `Name` · `Scope` (`National` \| `State` \| `Municipal`) · `BusinessId` (nullable — override local)

Feriados nacionais são **calculados**, não consultados em API: os fixos são constantes e os móveis derivam da Páscoa pelo algoritmo de Gauss. Custo zero (decisão 3.10). A empresa pode marcar que abre no feriado.

---

## 8. Scheduling — o núcleo

### `Appointment` — raiz de agregado

| Atributo | Notas |
|---|---|
| `Id` | |
| `BusinessId`, `ProfessionalId`, `ServiceId`, `CustomerId` | |
| `Period` | `TimeRange` em UTC — **inclui os buffers** |
| `ServiceDuration` | snapshot |
| `Price` | **snapshot** de `Money` |
| `ServiceNameSnapshot` | |
| `Status` | ver §8.1 |
| `Source` | `Online` \| `Counter` (decisão 3.11) |
| `CustomerNotes`, `BusinessNotes` | |
| `RequestedAt`, `ConfirmedAt`, `CancelledAt`, `CompletedAt` | |
| `CancelledBy` | `Customer` \| `Business` \| `System` |
| `CancellationReason` | |
| `ExpiresAt` | só enquanto `Pending` |
| `OverflowApproved` | transbordo aceito pela empresa (§3.5) |

**Por que snapshot de preço, duração e nome:** o histórico não pode ser reescrito quando a empresa reajusta a tabela. Um agendamento de março feito a R$ 50 continua sendo R$ 50 no relatório, mesmo que o serviço hoje custe R$ 70. Sem isso, todo o dashboard financeiro mente retroativamente.

### 8.1 Máquina de estados

```
                  ┌──── Rejected (empresa recusa)
                  │
Pending ──────────┼──── Expired  (ExpiresAt vencido, System)
                  │
                  └──── Confirmed ──┬── Completed
                                    ├── NoShow
                                    └── Cancelled
Pending ────────────────────────────── Cancelled (consumidor desiste)
```

Com `AutoConfirm = true`, nasce direto em `Confirmed`. Marcação de balcão (`Source = Counter`) nasce sempre em `Confirmed`.

| Estado | Ocupa o slot? |
|---|---|
| `Pending` | **Sim** |
| `Confirmed` | Sim |
| `Completed`, `NoShow` | Sim (é passado) |
| `Cancelled`, `Rejected`, `Expired` | Não |

### 8.2 Invariantes

1. **Não há sobreposição** entre agendamentos que ocupam slot, para o mesmo profissional. Garantido pelo banco (§8.4), não por código de aplicação.
2. O período tem que caber na disponibilidade calculada — exceto quando `OverflowApproved = true`.
3. `Period.Start` ≥ agora + `MinLeadTimeHours`, exceto para `Source = Counter`.
4. `Period.Start` ≤ hoje + `BookingHorizonDays`.
5. O profissional tem que estar habilitado para o serviço.
6. `Completed` e `NoShow` só depois de `Period.End`.
7. Consumidor só cancela até `CancellationWindowHours` antes. Empresa cancela sempre.
8. Um serviço por agendamento (decisão 3.6).
9. Um profissional atende um por vez (decisão 3.7).

### 8.3 `AppointmentEvent`
Trilha de auditoria imutável: `AppointmentId` · `FromStatus` · `ToStatus` · `ActorUserId` · `ActorRole` · `OccurredAt` · `Metadata`.

Serve de evidência para o TCC (tempo médio de resposta da empresa) e de log de acesso para a LGPD.

### 8.4 Prevenção de dupla reserva

Restrição de exclusão no PostgreSQL, sobre `professional_id` e o período, filtrando estados que ocupam slot. O banco recusa a sobreposição dentro da transação — inclusive entre canal online e balcão, que era o caso mais difícil. **Sem Redis, sem lock distribuído.** Detalhamento em ADR-005.

---

## 9. Serviços de domínio

### `AvailabilityCalculator`
Entrada: profissional, serviço, intervalo de datas.
Saída: lista de `Slot`.

Algoritmo: jornada recorrente do período → aplica `ExtraShift` → subtrai `DayOff`/`Vacation`/`Block` → subtrai feriados não sobrescritos → subtrai agendamentos que ocupam slot → recorta em passos de `SlotStepMinutes` → descarta slots onde a ocupação total não cabe (tolerando `OverflowToleranceMinutes`) → descarta o que viola antecedência e horizonte.

Puro, determinístico, sem I/O. **É a peça mais testável e mais crítica do sistema** — e a que merece a maior bateria de testes de unidade do TCC.

### `SlotSearch`
Busca por disponibilidade + serviço em várias empresas. Ordem obrigatória: **filtro geográfico primeiro** (PostGIS reduz o conjunto), depois filtro textual, depois cálculo de slots só nos candidatos restantes, janela máxima de 7 dias, paginado.

---

## 10. Reputation

### `Review`
`AppointmentId` (**único** — um agendamento, uma avaliação) · `Rating` · `Comment` · `CreatedAt`

**Invariantes:** só de agendamento `Completed`; só o consumidor dono; sem edição após envio; prazo de 30 dias.

`Business.AverageRating` e `ReviewCount` são desnormalizados e recalculados na escrita.

### `ReviewReply`
`ReviewId` (único) · `AuthorUserId` (papel `Owner`) · `Content`

---

## 11. Compliance (LGPD)

### `ConsentRecord`
`UserId` · `Purpose` (`SensitiveScheduling` \| `PublicProfile` \| `Marketing`) · `Version` · `GrantedAt` · `RevokedAt` · `IpAddress`

Agendamento em empresa com `IsSensitiveCategory = true` **exige** consentimento específico e destacado vigente (Art. 11). Sem consentimento, a operação é recusada — não é aviso, é bloqueio.

### `SensitiveAccessLog`
`ActorUserId` · `AppointmentId` · `Action` · `OccurredAt` · `IpAddress`

Registra toda leitura de agendamento sensível. Agendamento de categoria sensível **nunca** aparece em página pública nem em índice de busca.

---

## 12. Eventos de domínio

`AppointmentRequested` · `AppointmentConfirmed` · `AppointmentRejected` · `AppointmentExpired` · `AppointmentCancelled` · `AppointmentCompleted` · `NoShowMarked` · `ReviewSubmitted` · `BusinessActivated`

Publicados via Outbox na mesma transação da escrita. Consumidores: notificação (e-mail, in-app) e recálculo de reputação.

---

## 13. Divergências em relação ao modelo do Gemini

| Gemini | Aqui | Motivo |
|---|---|---|
| `establishments` com serviços e profissionais embutidos | Agregados separados com chave estrangeira | Aninhamento impede consulta e escrita independentes |
| Slot como dado | Slot como cálculo | Evita milhões de linhas mortas e invalidação em cascata |
| Preço só no `Service` | Snapshot no `Appointment` | Reajuste não pode reescrever o histórico |
| Lock em Redis | Constraint de exclusão | Garantia real, custo zero |
| Estoque de insumos | `Service.SuppliesNote` | Módulo cortado |
| `acceptsInsurance` funcional | Booleano informativo | Convênio é domínio inteiro |
| Sem modelo de disponibilidade | `WorkSchedule` + `ScheduleException` + `Holiday` | Era a ausência central dos dois protótipos |
| Sem consentimento nem log | `ConsentRecord`, `SensitiveAccessLog` | Art. 11 não é opcional |
