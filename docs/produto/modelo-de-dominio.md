# Modelo de Domínio

> Fase de definição. **Não é código** — é especificação para implementação futura.
> Domínio em inglês (decisão 6). Data original: 2026-09-03.
> **Revisado em 2026-09-22** por `docs/produto/decisoes-localizacao-notificacao-modelo.md` — as nove
> correções daquele documento já estão incorporadas abaixo. Onde algo mudou, a seção aponta a decisão
> de origem; o documento de 22/09 continua sendo a fonte do *porquê*.
> Substitui integralmente o modelo esboçado pelo Gemini.

---

## 1. Visão geral

**9 módulos, 19 entidades de domínio, 7 objetos de valor, 2 serviços de domínio.**
Somando a tabela `outbox` (infraestrutura, não domínio): 20 tabelas.

| Módulo | Entidades |
|---|---|
| Identity | `User`, `RefreshToken`, `UserToken` |
| Tenancy | `Business`, `BusinessMembership` |
| People | `Customer`, `Professional` |
| Catalog | `Service`, `ServiceProfessional` |
| Availability | `WorkSchedule`, `ScheduleException`, `Holiday` |
| Scheduling | `Appointment`, `AppointmentEvent` |
| Reputation | `Review`, `ReviewReply` |
| Compliance | `ConsentRecord`, `SensitiveAccessLog` |
| **Notifications** | `Notification` |

`Category` **não é entidade**: virou enum em código (§6, decisão 22/09 #4/#8). `UserToken` e
`Notification` são as duas entidades novas; o módulo `Notifications` é o nono.

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
Identidade única da plataforma (decisão 22/09 §2.0 — **não separar** consumidor e funcionário em contas distintas). Um `User` pode ser consumidor, membro de empresa, ou ambos; a troca de contexto é explícita na interface (seletor "consumidor" / "painel do Salão X"), e o token carrega o contexto ativo.

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

### `UserToken` ⚠️ nova (decisão 22/09 §1.9)
Token de uso único para fluxos fora da sessão autenticada.

`UserId` · `Type` (`EmailConfirmation` \| `PasswordReset` \| `BusinessInvite`) · `TokenHash` · `ExpiresAt` · `UsedAt`

**Invariante:** um token só é consumido uma vez; `UsedAt` preenchido invalida reuso.

---

## 4. Tenancy

### `Business` — raiz de agregado, é o tenant

| Atributo | Notas |
|---|---|
| `Id`, `Slug` | slug único, usado na URL pública |
| `LegalName`, `TradeName` | |
| `Category` | enum `Beleza` \| `Saude` (§6) — vertical principal |
| `Description`, `PhotoUrls`, `LogoUrl` | |
| `Address` | logradouro, número, bairro, cidade, UF, CEP |
| `Location` | `GeoPoint` — geocodificado do CEP |
| `LocationPrecision` | enum `Rooftop` \| `Street` \| `Locality` \| `City` ⚠️ novo (decisão 22/09 §5.2) |
| `LocationSource` | provedor + versão que gerou o ponto ⚠️ novo (§5.2) |
| `GeocodedAt` | ⚠️ novo (§5.2) |
| `LocationConfirmedAt` | nullable — preenchido quando o dono confirma o pino ⚠️ novo (§5.2) |
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
| `ReminderOffsetsHours` | lista de inteiros, padrão `[24, 1]` ⚠️ novo (decisão 22/09 §6.1) |
| `ArrivalInstructions` | texto livre curto, opcional ⚠️ novo (§6.2) |
| `Status` | `Draft` \| `Active` \| `Suspended` |

**Regra de busca:** só entra na busca por raio quem tem `LocationConfirmedAt` preenchido (§5.2). O checklist de ativação passa de "endereço geocodificável" para "endereço com ponto confirmado pelo dono".

**Comportamentos:** `Activate()` (exige ≥1 serviço, ≥1 profissional e ≥1 jornada), `UpdateSchedulingPolicy()`, `Suspend()`.

### `BusinessMembership`
Resolve a decisão 2.2: papel, não tipo de conta.

`UserId` · `BusinessId` · `Roles` (flags: `Owner`, `Professional`) · `InvitedAt` · `AcceptedAt` · `RevokedAt`

**Invariantes:** toda empresa tem ao menos um `Owner` ativo; um `User` tem no máximo uma associação ativa por empresa; um `User` com papel `Professional` tem no máximo **uma** associação ativa no total (decisão 2.3).

---

## 5. People

### `Customer`
Perfil de consumidor. Global, **fora do tenant** (decisão 2.5). ⚠️ Campos revisados em 22/09 §2.4.

| Campo | Tipo | Quando é pedido |
|---|---|---|
| `Id` | `Guid` v7, próprio | gerado no cadastro — decisão 22/09 #5 |
| `UserId` | `Guid` (FK única) | Cadastro |
| `BirthDate` | `DateOnly` | Cadastro — sustenta a regra dos 18 anos (§2.1) |
| `SocialName` | `string?` | Perfil, opcional — a interface exibe sempre que existir |
| `Cpf` | `string?`, cifrado | Só no 1º agendamento de categoria sensível, nunca no cadastro (§2.2) |
| `PhotoUrl` | `string?` | Perfil, opcional |
| `DefaultLocation` | `GeoPoint?` | Se a pessoa salvar (§5.5) |
| `PreferredCity` | `string?` | Se a pessoa salvar (§5.5) |

**Não existe** `Customer` por empresa. A relação empresa↔consumidor é derivada dos agendamentos.

**Idade mínima 18 anos, sem exceção** (decisão 22/09 §2.1). O agendamento para menor é feito pela conta de um adulto, usando `WalkInName`/`WalkInPhone` do `Appointment` (§8) para registrar quem será atendido.

### `Professional`
Perfil de execução. ⚠️ Campos revisados em 22/09 §1.4 e §3.

`BusinessId` · `BusinessMembershipId` **nullable** · `DisplayName` · `Specialty` · `Bio` · `PhotoUrl` · `Experience[]` · `Certifications[]` · `IsPubliclyVisible` · `PublicProfileConsentAt` · `AverageRating` · `ReviewCount`

**`DisplayName` é sempre público** — o consumidor precisa saber quem vai atendê-lo, e o nome já aparece no agendamento. **`IsPubliclyVisible` significa "perfil completo visível"** (foto, bio, experiência, certificações), não o nome (decisão 22/09 §3, corrige a 2.7).

**Invariantes:** `IsPubliclyVisible = true` exige `PublicProfileConsentAt` preenchido. `AverageRating`/`ReviewCount` são desnormalizados, recalculados a cada `Review` nova.

---

## 6. Catalog

### `Category` — enum, não entidade ⚠️ mudou em 22/09 §4
`Beleza` \| `Saude`. `RequiresSensitiveHandling` marca a segunda e liga o regime do Art. 11 em `Business.IsSensitiveCategory`.

**Por que enum, e não tabela:** é chave jurídica. Como tabela, um `UPDATE` desligaria o regime de dado sensível de uma vertical inteira sem ninguém perceber. Vira tabela de novo só se aparecer subcategoria (Barbearia/Salão/Estética) ou categoria proposta pela empresa.

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

### `ScheduleException` ⚠️ campos revisados em 22/09 §1.6
`BusinessId` · `ProfessionalId` **nullable** · `Type` (`DayOff` \| `Vacation` \| `Block` \| `ExtraShift`) · `TimeRange` · `Reason`

`ProfessionalId` nulo significa exceção da **empresa inteira** (fechamento geral), não de um profissional. `ExtraShift` **adiciona** disponibilidade (o sábado extra); os demais **subtraem**.

### `Holiday` — calendário puro, sem tenant ⚠️ mudou em 22/09 §1.6
`Date` · `Name` · `Kind` (`Fixed` \| `Movable`)

Feriados nacionais são **calculados**, não consultados em API: os fixos são constantes e os móveis derivam da Páscoa pelo algoritmo de Gauss. Custo zero (decisão 3.10). `Holiday` não tem `BusinessId` nem `Scope` — ele só diz que a data é feriado. A decisão de abrir, fechar ou ter horário especial naquele dia vive em `ScheduleException`, com `BusinessId` preenchido e `ProfessionalId` nulo.

⚠️ Dois feriados podem cair no mesmo dia (Sexta-feira Santa e Tiradentes coincidiram em 21/04/2000) — não colocar índice único só em `Date`.

---

## 8. Scheduling — o núcleo

### `Appointment` — raiz de agregado ⚠️ campos revisados em 22/09 §1.3 e §1.7

| Atributo | Notas |
|---|---|
| `Id` | |
| `BusinessId`, `ProfessionalId`, `ServiceId` | |
| `CustomerId` | **nullable** — vazio na marcação de balcão (decisão 22/09 #7) |
| `WalkInName`, `WalkInPhone` | preenchidos quando `CustomerId` é nulo, ou quando o agendamento é para terceiro (§2.1 do doc de 22/09) |
| `StartsAt`, `EndsAt` | horário de atendimento efetivo, UTC — **sem os buffers** |
| `BufferBeforeMinutes`, `BufferAfterMinutes` | snapshot do `Service` no momento da criação |
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

**`Period` (TimeRange) saiu do modelo.** No banco, o intervalo bloqueado pela constraint de exclusão é uma **coluna gerada** (`blocked_range`, `STORED`), calculada a partir de `StartsAt`/`EndsAt` e dos buffers — nunca escrita diretamente (decisão 22/09 §1.1):

```sql
blocked_range tstzrange GENERATED ALWAYS AS (
  tstzrange(starts_at - make_interval(mins => buffer_before_minutes),
            ends_at   + make_interval(mins => buffer_after_minutes), '[)')
) STORED
```

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

(Confirmado como decisão 22/09 #2 — já era o comportamento aqui, só deixado explícito.)

### 8.2 Invariantes

1. **Não há sobreposição** entre agendamentos que ocupam slot, para o mesmo profissional. Garantido pelo banco (§8.4), não por código de aplicação.
2. O período tem que caber na disponibilidade calculada — exceto quando `OverflowApproved = true`.
3. `StartsAt` ≥ agora + `MinLeadTimeHours`, exceto para `Source = Counter`.
4. `StartsAt` ≤ hoje + `BookingHorizonDays`.
5. O profissional tem que estar habilitado para o serviço.
6. `Completed` e `NoShow` só depois de `EndsAt`.
7. Consumidor só cancela até `CancellationWindowHours` antes. Empresa cancela sempre.
8. Um serviço por agendamento (decisão 3.6).
9. Um profissional atende um por vez (decisão 3.7).
10. `CustomerId` nulo exige `WalkInName` preenchido.

### 8.3 `AppointmentEvent`
Trilha de auditoria imutável: `AppointmentId` · `FromStatus` · `ToStatus` · `ActorUserId` · `ActorRole` · `OccurredAt` · `Metadata`.

Serve de evidência para o TCC (tempo médio de resposta da empresa) e de log de acesso para a LGPD.

### 8.4 Prevenção de dupla reserva

Restrição de exclusão no PostgreSQL, sobre `professional_id` e `blocked_range` (§8), filtrando os estados que ocupam slot:

```sql
ALTER TABLE scheduling.appointment ADD CONSTRAINT appointment_no_overlap
  EXCLUDE USING gist (professional_id WITH =, blocked_range WITH &&)
  WHERE (status IN ('Pending', 'Confirmed', 'Completed', 'NoShow'));
```

`btree_gist` entra na primeira migration. O banco recusa a sobreposição dentro da transação — inclusive entre canal online e balcão, que era o caso mais difícil. **Sem Redis, sem lock distribuído.** Detalhamento em ADR-005.

⚠️ Os nomes dos estados aparecem no `WHERE`. Renomear no C# sem migration correspondente desliga a trava em silêncio.

---

## 9. Serviços de domínio

### `AvailabilityCalculator`
Entrada: profissional, serviço, intervalo de datas.
Saída: lista de `Slot`.

Algoritmo: jornada recorrente do período → aplica `ExtraShift` → subtrai `DayOff`/`Vacation`/`Block` (empresa inteira ou só do profissional, conforme `ScheduleException.ProfessionalId`) → subtrai feriados não sobrescritos por exceção → subtrai agendamentos que ocupam slot → recorta em passos de `SlotStepMinutes` → descarta slots onde a ocupação total não cabe (tolerando `OverflowToleranceMinutes`) → descarta o que viola antecedência e horizonte.

Puro, determinístico, sem I/O — o instante atual entra como parâmetro, nunca lido de um relógio interno. **É a peça mais testável e mais crítica do sistema** — e a que merece a maior bateria de testes de unidade do TCC.

### `SlotSearch`
Busca por disponibilidade + serviço em várias empresas. Ordem obrigatória: **filtro geográfico primeiro** (`ST_DWithin` + índice GiST sobre `geography`, nunca `ST_Distance < x` — só o primeiro usa o índice), depois filtro textual, depois cálculo de slots só nos candidatos restantes, janela máxima de 7 dias, paginado.

---

## 10. Reputation

### `Review`
`AppointmentId` (**único** — um agendamento, uma avaliação) · `Rating` · `ProfessionalRating` (`Rating?`, opcional) ⚠️ novo (decisão 22/09 §3) · `Comment` · `CreatedAt`

**Invariantes:** só de agendamento `Completed`; só o consumidor dono; sem edição após envio; prazo de 30 dias.

`Business.AverageRating`/`ReviewCount` e `Professional.AverageRating`/`ReviewCount` (§5) são desnormalizados e recalculados na escrita. Avaliação por par serviço×profissional fica fora de escopo — quase todo par teria 0 ou 1 avaliação.

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

## 12. Notifications ⚠️ módulo novo (decisão 22/09 #8)

### `Notification`
`UserId` · `Type` · `AppointmentId` (nullable) · `ReadAt`

**Não guarda `Title`/`Body` prontos quando há `AppointmentId`.** A tela renderiza na hora, a partir do snapshot do `Appointment` e de `Business.ArrivalInstructions` — assim, uma correção de endereço ou de instrução aparece mesmo em lembrete ainda não lido. `Title`/`Body` só existem para notificação sem agendamento associado.

Canais: `INotificationChannel` com `Email` e `InApp` no MVP; `WhatsApp` é uma terceira implementação, não construída (decisão 22/09 §6.4).

---

## 13. Eventos de domínio

`AppointmentRequested` · `AppointmentConfirmed` · `AppointmentRejected` · `AppointmentExpired` · `AppointmentCancelled` · `AppointmentCompleted` · `NoShowMarked` · `ReviewSubmitted` · `BusinessActivated`

Publicados via Outbox na mesma transação da escrita. Consumidores: notificação (e-mail, in-app) e recálculo de reputação.

---

## 14. Divergências em relação ao modelo do Gemini

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
| `Category` como tabela | `Category` como enum | Chave jurídica — ninguém desliga o Art. 11 com um `UPDATE` (decisão 22/09 §4) |
