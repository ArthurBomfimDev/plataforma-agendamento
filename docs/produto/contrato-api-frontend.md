# Contrato API × frontend

> **Data:** 2026-10-27. **Lado da API:** `backend/src/Core/Booking.Arguments` em `698fa2c` (Ondas 1 a 3
> mergeadas) e o que este PR acrescenta. **Lado do frontend:** `frontend/src/lib/api/` (`types.ts`, `endpoints.ts`,
> `queries.ts`, `client.ts`, `errors.ts`) na mesma revisão, e a tela da agenda do dia na branch `dashboard`
> (`f09b048`). Só relatório: nenhum arquivo do frontend foi alterado.
>
> O JSON da API vem em camelCase. Os tipos do frontend são escritos à mão (há um `TODO` em `types.ts` para gerar
> do OpenAPI em `/openapi/v1.json`).

Legenda: ✅ igual · ➕ a API tem a mais (o frontend ignora) · ⚠️ diverge · ❌ falta.

## 1. Endpoints que o frontend chama hoje

| Endpoint | Função no frontend | Situação |
|---|---|---|
| `POST /api/auth/login` | `authApi.login` | ✅ |
| `POST /api/auth/register` | `authApi.register` | ✅ |
| `POST /api/auth/refresh` | `client.ts` (renovação deduplicada) | ✅ |
| `POST /api/auth/logout` | `authApi.logout` | ✅ |
| `GET /api/users/me` | `authApi.me` | ✅ |
| `GET/POST /api/customers/me` | `customersApi.me`/`register` | ✅ |
| `GET /api/businesses/search` | `businessesApi.search` | ➕ campos e parâmetros novos (§2.3) |
| `GET /api/businesses/{id}` | `businessesApi.get` | ✅ |
| `GET /api/businesses/{id}/services` | `businessesApi.services` | ✅ |
| `GET /api/businesses/{id}/professionals` | `businessesApi.professionals` | ✅ |
| `GET /api/businesses/{id}/availability` | `availabilityApi.day` | ✅ |
| `GET /api/businesses/{id}/availability/calendar` | `availabilityApi.calendar` | ✅ |
| `POST /api/appointments` | `appointmentsApi.request` | ✅ (erro: §3) |
| `GET /api/appointments/mine` | `appointmentsApi.mine` | ✅ |
| `POST /api/appointments/{id}/cancel` | `appointmentsApi.cancel` | ✅ |

## 2. Campo a campo

### 2.1 Identity

| Tipo | Campo | API | TS | Situação |
|---|---|---|---|---|
| `AuthResponse` | `accessToken` | `string` | `string` | ✅ |
| | `accessTokenExpiresAt` | `DateTimeOffset` | `string` | ✅ (ISO 8601) |
| | `refreshToken` | `string` | `string` | ✅ |
| `UserResponse` | `id`, `email`, `fullName` | `Guid`, `string`, `string` | `string` × 3 | ✅ |
| | `emailConfirmed` | `bool` | `boolean` | ✅ |
| `ContextTokenResponse` (`POST /api/users/me/context`) | — | existe | não tipado | ❌ no TS — o painel vai precisar para entrar no estabelecimento |

### 2.2 Tenancy, Catalog, People, Availability (rotas públicas)

| Tipo | Campo | API | TS | Situação |
|---|---|---|---|---|
| `PublicBusinessResponse` | `id`, `name`, `category`, `verified` | `Guid`, `string`, `string`, `bool` | iguais | ✅ |
| | `address` | `AddressResponse` (6 × `string?`) | 6 × `string \| null` | ✅ |
| | `latitude`, `longitude` | `double?` (nulo sem ponto confirmado) | `number \| null` | ✅ |
| | `cancellationWindowHours`, `pendingExpirationHours`, `autoConfirm`, `timeZone` | `int`, `int`, `bool`, `string` | iguais | ✅ |
| `PublicServiceResponse` | `id`, `name`, `description`, `durationMinutes`, `priceCents` | `Guid`, `string`, `string?`, `int`, `long` | iguais | ✅ (`long` → `number`: seguro até 2⁵³) |
| | `professionals` | `ServiceProfessionalResponse[]` | igual | ✅ |
| `ServiceProfessionalResponse` | `professionalId`, `priceCents`, `durationMinutes`, `hasOverride` | `Guid`, `long`, `int`, `bool` | iguais | ✅ |
| `PublicProfessionalResponse` | `id`, `displayName`, `specialty`, `bio` | `Guid`, `string`, `string?`, `string?` | iguais | ✅ |
| `CustomerResponse` | `id`, `birthDate`, `socialName` | `Guid`, `DateOnly`, `string?` | `string`, `string` (`yyyy-MM-dd`), `string \| null` | ✅ |
| `AvailableSlotsResponse` | `professionalId`, `serviceId`, `date`, `timeZone`, `holiday`, `slots` | `Guid`, `Guid`, `DateOnly`, `string`, `string?`, `DateTimeOffset[]` | iguais | ✅ |
| `AvailabilityCalendarResponse` | `professionalId`, `serviceId`, `timeZone`, `days` | iguais | iguais | ✅ |
| `AvailabilityDayResponse` | `date`, `works`, `slotCount`, `holiday` | `DateOnly`, `bool`, `int`, `string?` | iguais | ✅ |

### 2.3 Busca (`BusinessSearchItemResponse`)

| Campo | API | TS | Situação |
|---|---|---|---|
| `id`, `name`, `category`, `verified`, `district`, `city`, `distanceKm` | iguais | iguais | ✅ |
| `serviceId` | `Guid?` | — | ➕ desde a Onda 2 |
| `serviceName` | `string?` | — | ➕ — o card mostra |
| `durationMinutes` | `int?` | — | ➕ — o card mostra |
| `fromPriceCents` | `long?` | — | ➕ — o card mostra ("a partir de") |
| Parâmetros `category`, `maxPriceCents`, `sortBy` (`distance`\|`price`), `page`, `pageSize` | existem | `search` só manda `latitude`, `longitude`, `radiusKm`, `term` | ➕ |

Na tela de resultados (`features/search-results`, ainda em mock) continuam sem API: foto, horários no próprio
resultado (é uma consulta de disponibilidade por estabelecimento), filtro "Disponível hoje" e filtro de avaliação.

### 2.4 Scheduling

| Tipo | Campo | API | TS | Situação |
|---|---|---|---|---|
| `AppointmentResponse` | `id`, `businessId`, `professionalId`, `serviceId`, `serviceName`, `durationMinutes`, `priceCents`, `startsAt`, `endsAt` | iguais | iguais | ✅ |
| | `status` | `string` (nome do enum) | união dos 7 estados | ✅ — os 7 nomes batem com `AppointmentStatus` |
| | `source` | `string` (`Online` \| `Counter`) | `string` | ✅ (o TS podia ser a união) |
| | `expiresAt`, `attendeeName`, `customerNotes`, `cancellationReason`, `cancelledBy` | `string?` / `DateTimeOffset?` | `string \| null` | ✅ |
| `RequestAppointmentRequest` | `businessId`, `serviceId`, `professionalId`, `startsAt` | `Guid`, `Guid`, `Guid`, `DateTimeOffset` | `string` × 4 | ✅ |
| | `notes`, `attendeeName` | `string?` | `string \| null` | ✅ |
| | `idempotencyKey` | `string?` (até 64) | `string` (obrigatório) | ✅ — o TS é mais restrito, e está certo |

## 3. Erros

| Ponto | API | Frontend | Situação |
|---|---|---|---|
| Corpo de erro | ProblemDetails com `code` estável e extensões | `ApiError(status, code)` lê `code ?? title` | ✅ |
| 409 `appointment.slot_no_longer_available` | traz `alternatives` (até 5 horários) | `parse` descarta o corpo além do `code`; a mensagem genérica diz "Escolha outro" | ⚠️ as alternativas não chegam à tela |
| 503 `appointment.contention_try_again` (Onda 1, defesa) | novo | não traduzido | ⚠️ cai na mensagem genérica |
| 403 `tenant.missing`, `auth.forbidden` | existem | não traduzidos | ⚠️ (só relevantes no painel) |
| 400 `business.activation_checklist_incomplete` | traz `missing` | — | ❌ no TS (onboarding do painel) |
| 429 | limitador de autenticação | traduzido ("Muitas tentativas…") | ✅ |

## 4. O que a agenda do dia (branch `dashboard`) vai precisar

`features/business-agenda` usa `mock.ts`. Para trocar o mock pela API:

| A tela usa | API hoje | Situação |
|---|---|---|
| Agendamentos do dia por profissional | `GET /api/businesses/current/appointments?date=&professionalId=` → `PagedResult<AppointmentResponse>` | ✅ existe; não está em `endpoints.ts` |
| `start` (`HH:mm` no fuso), `durationMinutes`, `serviceName` | `startsAt` (UTC) + `timeZone` do estabelecimento, `durationMinutes`, `serviceName` | ✅ com conversão de fuso no frontend |
| `status: 'pending' \| 'confirmed'` | `status` com 7 estados | ⚠️ a agenda também recebe `Completed`, `NoShow`, `Cancelled`… do dia; a tela precisa decidir o que mostrar |
| **`customerName`** | **não existe** — `AppointmentResponse` só tem `attendeeName` (balcão ou atendimento para outra pessoa) | ❌ **lacuna**: o estabelecimento não recebe o nome do consumidor de um pedido online. Expor exige decisão (LGPD: em Saúde, o nome do paciente é dado sensível e sua leitura vai para o log de acesso) |
| `requestedAt` | não está no `AppointmentResponse` (existe na entidade) | ❌ — o prazo de resposta do pendente usa `expiresAt`, que já vem |
| Jornada do dia (`workStart`, `workEnd`) | `GET /api/businesses/current/work-schedules?professionalId=` (todas as linhas da semana) | ✅ com filtro por dia no frontend; pausa = duas linhas |
| Bloqueios (`AgendaBlock`) | `GET /api/businesses/current/schedule-exceptions` | ✅ parcial — "Bloqueio recorrente" não existe: a pausa recorrente é a ausência de linha de jornada |
| `pendingRequests` por profissional | `GET /api/businesses/current/appointments/pending` | ⚠️ sem parâmetro `professionalId` na rota (o repositório já aceita); contagem por profissional teria de ser feita no frontend |
| Indicadores (`AgendaSummary`: receita esperada, ocupação, variação semanal, tempo médio de resposta) | não existem | ❌ — nenhum endpoint de indicador; o mock já avisa que não são métrica medida |
| Confirmar, recusar, cancelar, concluir, falta | `POST …/appointments/{id}/confirm`, `reject`, `cancel`, `complete`, `no-show` | ✅ existem; não estão em `endpoints.ts` |
| Marcação de balcão ("Encaixar") | `POST /api/businesses/current/appointments/counter` | ✅ |
| Remarcação (`AgendaMove`) | **não existe** | ❌ — hoje seria cancelar e marcar de novo |
| Entrar no painel | `POST /api/users/me/context` → `ContextTokenResponse` | ✅ existe; não tipado no TS |

## 5. Resumo para fechar o lado do frontend

1. Tipar os campos novos da busca e o `ContextTokenResponse`.
2. Ler `alternatives` do 409 no `client.ts` para a tela de "horário ocupado".
3. Traduzir `appointment.contention_try_again` (503: "tente de novo").
4. Para a agenda: as rotas `businesses/current/*` já existem; faltam no backend o **nome do consumidor** (decisão de
   LGPD), `requestedAt`, filtro de pendentes por profissional, indicadores e remarcação.
