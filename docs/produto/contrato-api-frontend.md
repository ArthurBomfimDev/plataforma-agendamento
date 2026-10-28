# Contrato API × frontend

> **Data:** 2026-10-27, atualizado nas Ondas 5A, 5B, 6A e 6B (28/10). **Lado da API:** `backend/src/Core/Booking.Arguments` em `698fa2c` (Ondas 1 a 3
> mergeadas) e o que este PR acrescenta. **Lado do frontend:** `frontend/src/lib/api/` (`types.ts`, `endpoints.ts`,
> `queries.ts`, `client.ts`, `errors.ts`) na mesma revisão, e a tela da agenda do dia na branch `dashboard`
> (`f09b048`). Até a 5B era só relatório; a partir da 6A o frontend do consumidor também muda (§4.2).
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
| `POST /api/auth/confirm-email` | `authApi.confirmEmail` | ✅ desde a 6A |
| `POST /api/auth/resend-confirmation` (novo na 6A) | `authApi.resendConfirmation` | ✅ |
| `POST /api/auth/forgot-password` | `authApi.forgotPassword` | ✅ desde a 6A |
| `POST /api/auth/reset-password` | `authApi.resetPassword` | ✅ desde a 6A |
| `GET /api/geo/postal-code/{cep}` (novo na 6B) | `geoApi.postalCode` | ✅ |
| `GET /api/geo/search?q=` (novo na 6B) | `geoApi.search` | ✅ |
| `GET /api/geo/reverse?lat=&lng=` (novo na 6B) | `geoApi.reverse` | ✅ |
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
| | `requestedAt` | `DateTimeOffset` (sempre) | — | ➕ desde a 5A (27/10) |
| | `customerName` | `string?` — **só nas rotas do estabelecimento**: nome social do consumidor, senão o do cadastro; no balcão, o nome informado. **Nulo** nas rotas do consumidor (`/api/appointments/*`) | — | ➕ desde a 5A |
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
| 403 `identity.email_not_confirmed` (6A) | login e refresh de conta sem e-mail confirmado; só depois da senha certa (senha errada continua 401 `auth.invalid_credentials`) | traduzido; Entrar mostra "Reenviar e-mail de confirmação" | ✅ |
| 400 `user_token.invalid` | link de confirmação ou de redefinição vencido, usado ou de outro tipo | telas "Link inválido" | ✅ |

## 4. O que a agenda do dia (branch `dashboard`) vai precisar

`features/business-agenda` usa `mock.ts`. Para trocar o mock pela API:

| A tela usa | API hoje | Situação |
|---|---|---|
| Agendamentos do dia por profissional | `GET /api/businesses/current/appointments?date=&professionalId=` → `PagedResult<AppointmentResponse>` | ✅ existe; não está em `endpoints.ts` |
| `start` (`HH:mm` no fuso), `durationMinutes`, `serviceName` | `startsAt` (UTC) + `timeZone` do estabelecimento, `durationMinutes`, `serviceName` | ✅ com conversão de fuso no frontend |
| `status: 'pending' \| 'confirmed'` | `status` com 7 estados | ⚠️ a agenda também recebe `Completed`, `NoShow`, `Cancelled`… do dia; a tela precisa decidir o que mostrar |
| **`customerName`** | `AppointmentResponse.customerName` nas rotas `businesses/current/appointments/*` (decisão T, 27/10). Em Saúde, a leitura continua registrada no log de acesso | ✅ desde a 5A |
| `requestedAt` | `AppointmentResponse.requestedAt` | ✅ desde a 5A |
| Jornada do dia (`workStart`, `workEnd`) | `GET /api/businesses/current/work-schedules?professionalId=` (todas as linhas da semana) | ✅ com filtro por dia no frontend; pausa = duas linhas |
| Bloqueios (`AgendaBlock`) | `GET /api/businesses/current/schedule-exceptions` | ✅ parcial — "Bloqueio recorrente" não existe: a pausa recorrente é a ausência de linha de jornada |
| `pendingRequests` por profissional | `GET /api/businesses/current/appointments/pending?professionalId=` — `totalCount` dá o número. Para o papel `Professional`, vale sempre o próprio, seja qual for o parâmetro | ✅ desde a 5A |
| Indicadores (`AgendaSummary`: receita esperada, ocupação, variação semanal, tempo médio de resposta) | não existem | ❌ — nenhum endpoint de indicador; o mock já avisa que não são métrica medida |
| Confirmar, recusar, cancelar, concluir, falta | `POST …/appointments/{id}/confirm`, `reject`, `cancel`, `complete`, `no-show` | ✅ existem; não estão em `endpoints.ts` |
| Marcação de balcão ("Encaixar") | `POST /api/businesses/current/appointments/counter` | ✅ |
| Remarcação (`AgendaMove`) | **não existe** | ❌ — hoje seria cancelar e marcar de novo |
| Entrar no painel | `POST /api/users/me/context` → `ContextTokenResponse` | ✅ existe; não tipado no TS |

## 4.1 E-mails (Onda 5B, 28/10) — o que o frontend precisa ter

Nenhuma rota de API nova. Os e-mails levam links para **rotas do frontend** (HashRouter), montadas a partir de
`App__PublicBaseUrl`:

| Link no e-mail | Tela que o frontend precisa ter | Chamada de API que a tela faz |
|---|---|---|
| `#/confirmar-email?token={token}` | Confirmação de e-mail (lê o `token` da URL e confirma) — **tela feita na 6A** | `POST /api/auth/confirm-email` `{ token }` |
| `#/redefinir-senha?token={token}` | Nova senha (lê o `token`, pede a senha nova) — **tela feita na 6A** | `POST /api/auth/reset-password` `{ token, newPassword }` |
| `#/painel/pedidos` | Pedidos pendentes do painel | `GET /api/businesses/current/appointments/pending` |
| `#/painel/agenda` | Agenda do dia do painel (branch `dashboard`) | `GET /api/businesses/current/appointments?date=` |

- O token vem com escape de URL (`encodeURIComponent`): a tela usa o valor de `URLSearchParams` direto.
- O e-mail de confirmação de agendamento leva um `.ics` anexo. O botão "Adicionar à agenda" dentro do app e o feed de
  agenda são da Onda 5C.
- Os e-mails chegam alguns segundos depois da ação (outbox + worker). Em desenvolvimento, aparecem no Mailpit:
  `http://localhost:8025`.
- Os textos da tela "Pedido enviado" sobre lembretes continuam sem backend até a 5C (`MOCK_REMINDER_HOURS = [24, 3]`,
  padrão real `[24, 1]`).

## 4.2 Conta com e-mail obrigatório (Onda 6A, 28/10)

- **Cadastro não abre sessão.** `POST /api/auth/register` continua `201` com `UserResponse` (sem token) e põe o e-mail de
  confirmação na outbox. O frontend vai para `#/sign-up/check-email`; o endereço vai no estado da navegação, nunca na URL.
- **Login e refresh** de conta não confirmada: `403 identity.email_not_confirmed`. Desligável por
  `Identity__RequireEmailConfirmation=false` (padrão `true`).
- **`POST /api/auth/resend-confirmation`** `{ email }`: sempre `202` com corpo vazio, exista a conta ou não. No máximo um
  e-mail a cada 60 s por conta (contado do último token emitido, vale entre instâncias) e o limitador `auth` por IP.
  Um reenvio invalida o link anterior.
- **Redefinir a senha confirma o e-mail**: quem abriu o link provou que lê a caixa de entrada.
- **Perfil de consumidor** (data de nascimento): sem sessão no cadastro, fica guardado no `localStorage` do aparelho
  (`lib/api/pending-profile.ts`) e é criado na primeira entrada com o mesmo e-mail. Quem entra por outro aparelho fica
  sem perfil até existir a tela de perfil.

Rotas novas do frontend: `#/sign-up/check-email`, `#/forgot-password`, `#/confirmar-email?token=` e
`#/redefinir-senha?token=` (os dois últimos são os caminhos dos e-mails da 5B, §4.1).

## 4.3 Localização (Onda 6B, 28/10)

Rotas públicas, limite de 30 por minuto por IP (`geo`), cache no servidor. ADR-022.

| Rota | Resposta | Erros |
|---|---|---|
| `GET /api/geo/postal-code/{cep}` (com ou sem hífen) | `{ postalCode, street, district, city, state }` — `street` e `district` nulos em CEP geral | 400 `geo.postal_code_invalid` · 404 `postal_code.not_found` · 503 `geo.provider_unavailable` |
| `GET /api/geo/search?q=` (3 a 200 caracteres) | `PagedResult<{ label, latitude, longitude, precision }>`, até 5, só Brasil; `precision` ∈ `Rooftop`, `Street`, `Locality`, `City` | 400 `geo.query_invalid` · 503 |
| `GET /api/geo/reverse?lat=&lng=` | `{ label }` — "Centro, Garça" | 400 `geo.coordinates_invalid` · 404 `place.not_found` · 503 |

- **Sem autocomplete:** a busca por texto só roda no envio (política do Nominatim público).
- **Coordenada:** a API arredonda para 3 casas antes de falar com o provedor; o frontend já manda arredondado
  (`geoApi.reverse`) e só guarda arredondado.
- **CEP não traz ponto:** o seletor busca o endereço do CEP em `/api/geo/search`, do mais preciso ao mais largo.
- **Frontend:** `useGeolocation()` (`hooks/use-geolocation`), store `lib/zustand/location` (`localStorage`
  `vagoo-location`), seletor `components/location-picker`, aberto pela barra superior (desktop) e pela Home
  (celular). Sem referência escolhida, a Home não busca: mostra "Escolher localização". `DEFAULT_LOCATION` saiu;
  "Garça, SP (demonstração)" é uma opção do seletor.
- **Painel (Rafael):** a confirmação do ponto pelo dono (`PUT /api/businesses/current/location`, `ConfirmLocationRequest`)
  ainda não tem tela; quando houver, o palpite pode vir de `/api/geo/search` com o endereço do estabelecimento.

## 5. Resumo para fechar o lado do frontend

1. Tipar os campos novos da busca e o `ContextTokenResponse`.
2. Ler `alternatives` do 409 no `client.ts` para a tela de "horário ocupado".
3. Traduzir `appointment.contention_try_again` (503: "tente de novo").
4. Para a agenda: as rotas `businesses/current/*` já existem, com `customerName`, `requestedAt` e o filtro de
   pendentes por profissional desde a 5A; faltam no backend os indicadores e a remarcação.
