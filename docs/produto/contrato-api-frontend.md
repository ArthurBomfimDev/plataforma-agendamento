# Contrato API × frontend

> ⚠️ **Desde a 7H (31/10), o lado do frontend mora em `frontend/src/api/`** (`base/`: cliente axios, interceptores,
> erros; `services/`; `models/`), da refatoração do Rafael. Os caminhos `lib/api/…` citados nas seções antigas são os
> de antes; o comportamento descrito continua valendo. Ver §4.9.
>
> **Data:** 2026-10-27, atualizado nas Ondas 5A, 5B, 6A, 6B, 6C, 6D (28/10), 7A, 7D, 7C, 7CF (29/10) e 7H (31/10). **Lado da API:** `backend/src/Core/Booking.Arguments` em `698fa2c` (Ondas 1 a 3
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
| `GET /api/users/me` | `authApi.me` | ✅ — desde a 7A traz `hasCustomerProfile` e `businesses` (§4.6) |
| `POST /api/users/me/context` | `authApi.switchContext` | ✅ desde a 7A |
| `GET /api/businesses/current` | `panelApi.business` (só o dono) | ✅ desde a 7A |
| `GET /api/businesses/current/professionals` | `panelApi.professionals` | ✅ desde a 7A |
| `GET /api/businesses/current/work-schedules?professionalId=` | `panelApi.workSchedules` | ✅ desde a 7A |
| `GET /api/businesses/current/services` | `panelApi.services` (marcação de balcão) | ✅ desde a 7A |
| `GET /api/businesses/current/appointments?date=` | `panelApi.agenda` | ✅ desde a 7A |
| `PUT /api/users/me` (novo na 7CF) | `authApi.updateMe` (só o nome) | ✅ — `user.full_name_required` se vazio (teste U1) |
| `POST /api/users/me/password` (novo na 7CF) | `authApi.changePassword` | ✅ — pede a senha atual (400 `user.current_password_invalid`), encerra as outras sessões e devolve uma nova; 5 por 15 min por conta (teste U2) |
| `GET …/appointments?date=&to=` (novo na 7CF) | `panelApi.agendaRange` (semana e mês, paginado) | ✅ — até 42 dias; fora disso, 400 `agenda.range_invalid` (teste J5) |
| `GET /api/businesses/current/appointments/pending` | `panelApi.pending` | ✅ desde a 7A |
| `POST …/appointments/{id}/confirm` · `reject` · `cancel` · `complete` · `no-show` | `panelApi.confirm` … `noShow` | ✅ desde a 7A |
| `POST /api/businesses/current/appointments/counter` | `panelApi.counter` | ✅ desde a 7A |
| `POST /api/businesses/current/services` · `PUT …/{id}` | `manageApi.createService` · `updateService` | ✅ desde a 7D (§4.7) |
| `PUT` · `DELETE …/services/{id}/professionals/{pid}` | `manageApi.enableProfessional` · `disableProfessional` | ✅ desde a 7D — o preço e a duração próprios por profissional ainda não têm tela |
| `POST /api/businesses/current/professionals` (só `isMe: true`, desde 05/11) · `PUT …/{id}` | `manageApi.createProfessional` · `updateProfessional` | ✅ desde a 7D |
| ~~`PUT` · `DELETE …/professionals/{id}/public-profile-consent`~~ | — | **Removidas** (ADR-031, §4.13): o perfil é sempre público e a base é a declaração do dono |
| `POST` · `PUT …/{id}` · `DELETE …/{id}` em `…/work-schedules` | `manageApi.addWorkSchedule` · `updateWorkSchedule` · `removeWorkSchedule` | ✅ desde a 7D |
| `GET` · `POST` · `DELETE …/{id}` em `…/schedule-exceptions`, `GET …/affected-appointments` | `manageApi.exceptions` · `addException` · `removeException` · `affectedAppointments` | ✅ desde a 7D |
| `PUT /api/businesses/current/scheduling-policy` | `manageApi.updatePolicy` (`timeZone: null` mantém o fuso) | ✅ desde a 7D |
| `PUT` · `DELETE …/current/logo`, `…/current/cover`, `…/professionals/{id}/photo` | `uploadFile` com `uploadPaths` · `manageApi.removeBusinessImage` · `removeProfessionalPhoto` | ✅ desde a 7D |
| `PUT …/current/address`, `…/current/location`, `POST …/current/submit` | — | ⬜ existem; a tela de cadastro e endereço do estabelecimento não está no recorte da 7D |
| `GET/POST /api/customers/me` | `customersApi.me`/`register` | ✅ |
| `GET /api/businesses/search` | `businessesApi.search` | ✅ desde a 6C (§2.3, §4.4) |
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
| `CurrentUserResponse` (`GET /api/users/me`, novo na 7A) | `UserResponse` + `hasCustomerProfile`, `businesses` | + `bool`, `UserBusinessResponse[]` (até 20) | iguais | ✅ |
| `UserBusinessResponse` | `businessId`, `name`, `role` (`Owner` \| `Professional`) | `Guid`, `string`, `string` | iguais | ✅ |
| `ContextTokenResponse` (`POST /api/users/me/context`) | `accessToken`, `accessTokenExpiresAt`, `businessId`, `role` | `string`, `DateTimeOffset`, `Guid?`, `string?` | iguais | ✅ desde a 7A |

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
| `serviceId`, `serviceName`, `durationMinutes`, `fromPriceCents` | nuláveis | `string \| null`, `number \| null` | ✅ desde a 6C — o card mostra ("a partir de") |
| Parâmetros `category`, `maxPriceCents`, `sortBy` (`distance`\|`price`), `radiusKm`, `term` | existem | todos enviados desde a 6C | ✅ |
| Parâmetro `city` (novo na 7C) | só a cidade, até 50 km do ponto, sem acento e sem caixa; ignora `radiusKm` | enviado na distância "Cidade" (§4.4) | ✅ |
| `page`, `pageSize` | existem | não enviados (primeira página, 20) | ⚠️ sem "carregar mais" |

Sem API na tela de resultados: foto, horários no próprio resultado (é uma consulta de disponibilidade por
estabelecimento) e os filtros "Disponível hoje" e "★ 4,5+" — saíram da tela na 6C (§4.4).

### 2.4 Scheduling

| Tipo | Campo | API | TS | Situação |
|---|---|---|---|---|
| `AppointmentResponse` | `id`, `businessId`, `professionalId`, `serviceId`, `serviceName`, `durationMinutes`, `priceCents`, `startsAt`, `endsAt` | iguais | iguais | ✅ |
| | `status` | `string` (nome do enum) | união dos 7 estados | ✅ — os 7 nomes batem com `AppointmentStatus` |
| | `source` | `string` (`Online` \| `Counter`) | `string` | ✅ (o TS podia ser a união) |
| | `expiresAt`, `attendeeName`, `customerNotes`, `cancellationReason`, `cancelledBy` | `string?` / `DateTimeOffset?` | `string \| null` | ✅ |
| | `requestedAt` | `DateTimeOffset` (sempre) | `string` | ✅ tipado na 7A |
| | `customerName` | `string?` — **só nas rotas do estabelecimento**: nome social do consumidor, senão o do cadastro; no balcão, o nome informado. **Nulo** nas rotas do consumidor (`/api/appointments/*`) | `string \| null` (opcional) | ✅ tipado na 7A |
| `RequestAppointmentRequest` | `businessId`, `serviceId`, `professionalId`, `startsAt` | `Guid`, `Guid`, `Guid`, `DateTimeOffset` | `string` × 4 | ✅ |
| | `notes`, `attendeeName` | `string?` | `string \| null` | ✅ |
| | `idempotencyKey` | `string?` (até 64) | `string` (obrigatório) | ✅ — o TS é mais restrito, e está certo |

## 3. Erros

| Ponto | API | Frontend | Situação |
|---|---|---|---|
| Corpo de erro | ProblemDetails com `code` estável e extensões | `ApiError(status, code)` lê `code ?? title` | ✅ |
| 409 `appointment.slot_no_longer_available` | traz `alternatives` (até 5 horários) | `parse` descarta o corpo além do `code`; a mensagem genérica diz "Escolha outro" | ⚠️ as alternativas não chegam à tela |
| 503 `appointment.contention_try_again` (Onda 1, defesa) | novo | não traduzido | ⚠️ cai na mensagem genérica |
| 403 `tenant.missing`, `auth.forbidden` | existem | traduzidos na 7A | ✅ |
| 403 `appointment.customer_context_required` (novo na 7A) | `POST /api/appointments` com token no contexto de estabelecimento | traduzido; o frontend nem chega a chamar (as telas de consumidor levam à troca de contexto) | ✅ |
| 409 `appointment.cannot_book_own_business` (novo na 7A) | o dono pede horário no próprio estabelecimento | traduzido ("use a marcação de balcão") | ✅ |
| 409 `appointment.cannot_*_from_current_status`, `cannot_confirm_expired` | transição de estado inválida (pedido já respondido em outra aba, expirado) | traduzidos na 7A; a lista é buscada de novo | ✅ |
| 400 `business.activation_checklist_incomplete` | traz `missing` | — | ❌ no TS (onboarding do painel) |
| 429 | limitador de autenticação | traduzido ("Muitas tentativas…") | ✅ |
| 403 `identity.email_not_confirmed` (6A) | login e refresh de conta sem e-mail confirmado; só depois da senha certa (senha errada continua 401 `auth.invalid_credentials`) | traduzido; Entrar mostra "Reenviar e-mail de confirmação" | ✅ |
| 400 `user_token.invalid` | link de confirmação ou de redefinição vencido, usado ou de outro tipo | telas "Link inválido" | ✅ |

## 4. Agenda do dia e pedidos pendentes (painel do Rafael, ligado na 7A)

Desde a 7A, `features/business-agenda` e `features/pending-requests` recebem os dados por props, das rotas
`router/panel-agenda-route.tsx` e `panel-requests-route.tsx`; os `mock.ts` viraram `fixtures.ts`, só dos testes. A
conversão mora em `router/panel-adapters.ts`.

| A tela usa | API | Situação |
|---|---|---|
| Agendamentos do dia por profissional | `GET /api/businesses/current/appointments?date=` → `PagedResult<AppointmentResponse>` (até 100) | ✅ |
| `start` (`HH:mm` no fuso), duração, serviço | `startsAt`/`endsAt` (UTC) + fuso do estabelecimento | ✅ conversão com `Intl` |
| Estados | `Pending`, `Confirmed`, `Completed`, `NoShow` ficam na agenda; `Rejected`, `Expired`, `Cancelled` saem (liberaram o horário) | ✅ |
| `customerName` | nome social, senão o do cadastro; no balcão, o informado. Em Saúde, a leitura fica no log de acesso (decisão do Arthur: o painel mostra o nome) | ✅ |
| Prazo do pedido | `expiresAt` da API (antes: `requestedAt` + 12 h fixas) | ✅ |
| Jornada do dia | `work-schedules` de cada profissional, filtrado pelo dia da semana e pela vigência; com duas faixas, da primeira entrada à última saída | ✅ |
| Bloqueios (`AgendaBlock`) | `schedule-exceptions` existe, mas a tela ainda não mostra | ⚠️ trabalho futuro |
| Pedidos pendentes | `…/appointments/pending` (até 50); `totalCount` alimenta os contadores | ✅ |
| Indicadores do dia | sem endpoint: total, confirmados, pendentes e receita prevista são somados da agenda no frontend; ocupação e tempo de resposta saíram | ✅ |
| Confirmar, recusar, cancelar, concluir, falta | `POST …/{id}/confirm`, `reject`, `cancel`, `complete`, `no-show` — recusar, falta e cancelar pedem confirmação | ✅ |
| Marcação de balcão ("+ Marcação de balcão" e "Encaixar") | `POST …/appointments/counter`; serviço, horário (no fuso do estabelecimento), nome, telefone opcional | ✅ |
| Remarcação | **não existe** no backend | ❌ — a grade não arrasta mais; o detalhe diz "cancele e peça ao consumidor que agende de novo". Trabalho futuro |
| Histórico do consumidor ("3 atendimentos · 1 falta") | não existe | ❌ — a linha não aparece, em vez de afirmar "primeira vez" sem saber |
| Atualização | a cada 30 s (`PANEL_REFRESH_MS`) e depois de cada ação, também quando ela falha (um 409 quer dizer lista velha) | ✅ |
| Papel `Professional` | a API devolve só a própria agenda; a tela mostra só quem tem item e esconde Serviços, Profissionais, Jornadas e Configurações | ✅ |

## 4.1 E-mails (Onda 5B, 28/10) — o que o frontend precisa ter

Nenhuma rota de API nova. Os e-mails levam links para **rotas do frontend** (HashRouter), montadas a partir de
`App__PublicBaseUrl`:

| Link no e-mail | Tela que o frontend precisa ter | Chamada de API que a tela faz |
|---|---|---|
| `#/confirmar-email?token={token}` | Confirmação de e-mail (lê o `token` da URL e confirma) — **tela feita na 6A** | `POST /api/auth/confirm-email` `{ token }` |
| `#/redefinir-senha?token={token}` | Nova senha (lê o `token`, pede a senha nova) — **tela feita na 6A** | `POST /api/auth/reset-password` `{ token, newPassword }` |
| `#/painel/pedidos` | Pedidos pendentes do painel — desde a 7A redireciona para `#/panel/requests` | `GET /api/businesses/current/appointments/pending` |
| `#/painel/agenda` | Agenda do dia do painel — desde a 7A redireciona para `#/panel` | `GET /api/businesses/current/appointments?date=` |

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

## 4.4 Busca e categorias (Onda 6C, 28/10)

- **Rota `#/search?term=&category=&maxPrice=&sort=&radius=`** (`router/search-route.tsx`). Os filtros moram na
  URL; valor que o backend não aceita (link editado à mão) é ignorado em vez de virar 400. A localização não vai na URL.
- **Tiles da Home** (`features/home/consts.ts`, o `mock.ts` saiu): Beleza e Saúde mandam `category=Beleza|Saude`;
  Cabelo, Barbearia, Unhas e Sobrancelha mandam `term` (`corte`, `barba`, `unha`, `sobrancelha`, conferidos contra os
  serviços do seed).
- **Filtros na tela:** categoria e termo como chips removíveis; distância (Onda 7C, abaixo); "Até R$ 50/100/200"
  (`maxPriceCents`); ordenar por "Mais perto" ou "Menor preço" (`sortBy`).
- **Distância (Ondas 7C e 7CF, 29/10):** "Cidade" (padrão) e 1, 2, 5, 10 e 20 km (`lib/api/search.ts`).
  - **Mora no seletor de endereço** da barra do topo (7CF, como no iFood): os chips ficam no mesmo painel do
    endereço, e os dois são guardados juntos (`useLocationStore`, chave `vagoo-location`; o `persist` engole o
    armazenamento bloqueado). A busca só lê e mostra um chip ("Cidade: Garça", "Até 5 km") que reabre o seletor. A
    Home usa a mesma distância.
  - Na URL: `radius=city|1|2|5|10|20`. Quem cede quando divergem é decidido por `distanceSync`: a URL vence quando
    foi ela que mudou (link aberto, voltar no histórico) e o seletor recebe o valor; tocar num chip do seletor
    atualiza a URL. Um link sem distância (as categorias da Home) usa a do seletor.
  - "Cidade" manda `city` com a cidade da localização escolhida, e o backend ignora o raio (abaixo). Sem cidade
    conhecida (localização guardada antes da 7C, ou o provedor não soube), busca a até 20 km, e a tela avisa.
  - O seletor de localização guarda `city` e `state` junto do ponto: a do CEP vem dos Correios; a do aparelho e a da
    busca, do Nominatim (`ReverseGeocodeResponse` e `GeoPlaceResponse` ganharam `city` e `state`, opcionais).
  - **Estado vazio:** diz onde procurou. Abaixo de 20 km, "Ampliar para 20 km"; em 20 km ou em Cidade, "Limpar
    filtros" quando há termo, categoria ou preço, e "Trocar localização" quando não há.
- **`City` no backend (`SearchBusinessesRequest`):** com ela, os candidatos vêm de um raio de 50 km (o teto) e ficam
  só os da cidade, comparada sem acento, sem diferença de maiúsculas e com espaços normalizados. O teto evita a
  homônima de outro estado. Sem `City`, nada muda: `RadiusKm` com padrão 5, limitado a 0,1–50. Testes H5 e H6.
- **Termo (7CF, ADR-024):** casa sem acento e sem caixa com o nome do serviço, do estabelecimento e da categoria, e
  com um dicionário de sinônimos no código (`SearchText`: "cabelo" → Corte, Escova, Coloração, Hidratação,
  barbearia; "unha" → Manicure, Pedicure, Pé e mão; "massagem" → relaxante, drenagem). Plural simples conta como o
  singular. Em memória, sobre os candidatos do filtro geográfico; sem migration. Testes H7 e H8.
- **Trabalho futuro (sem backend):** "Disponível hoje" (exigiria disponibilidade por resultado na busca) e "★ 4,5+"
  (módulo Reputation fora do recorte). Também: paginação ("carregar mais") e horários no card.
- **Botão "Buscar":** `components/search-button` — `Button` primário do sistema, `type="submit"` dentro de
  `<form role="search">`, alvo de 44 px, foco visível, desligado com o campo vazio e `aria-busy` durante a busca.
  Usado na Home (desktop), na barra superior e nos resultados.
- `SearchResultCard`: `availability` ausente não afirma mais "sem horário" (a busca não calcula horários); ganhou
  `priceFrom` e `onOpen` (o card inteiro abre o estabelecimento).

## 4.5 Imagens (Onda 6D, 28/10)

ADR-023. O banco guarda só a referência; os bytes ficam no volume `media-data`, servidos em `/media/…`.

| Rota | Quem | Resposta |
|---|---|---|
| `PUT /api/businesses/current/logo` · `DELETE …` | dono (contexto `Owner`) | `BusinessDetailResponse` com `logo` |
| `PUT /api/businesses/current/cover` · `DELETE …` | dono | `BusinessDetailResponse` com `cover` |
| `PUT /api/businesses/current/professionals/{id}/photo` · `DELETE …` | dono, ou o próprio profissional (contexto `Professional`, vínculo da conta) | `ProfessionalResponse` com `photo` |

- **Envio:** `multipart/form-data`, campo `file`. JPEG, PNG ou WebP **pelo conteúdo**, até **5 MB**, até 6000 px de lado.
  Erros: `415 image.unsupported_type` (SVG, executável renomeado, GIF…), `413 image.too_large`,
  `400 image.dimensions_too_large`, `400 image.unreadable`, `400 image.empty`, `403 auth.forbidden` (foto de outro
  profissional), `404 professional.not_found` (outro estabelecimento), `401` sem login, `429` acima de 20 por hora.
- **Respostas:** `logo`, `cover` (em `BusinessDetailResponse`, `PublicBusinessResponse` e `BusinessSearchItemResponse`) e
  `photo` (em `ProfessionalResponse` e `PublicProfessionalResponse`) são `null` ou `{ small, medium, large }`: WebP de 160,
  640 e 1280 px no lado maior. URL relativa à API (`/media/…`) ou absoluta — `lib/api/media.ts#mediaUrl` resolve.
- **Foto pública do profissional:** só com o perfil completo visível (consentimento do próprio profissional). Sem isso, nula.
- **Padrões sem imagem** (`frontend/src/global/images/defaults/`): `BusinessIllustration` (Beleza, Saúde; tokens da R5,
  claro e escuro), `InitialsAvatar`, `ServiceIcon`. `components/smart-image` usa `srcSet`, `loading="lazy"`, espaço
  reservado e cai no padrão se a imagem falhar.

### Para o Rafael: plugar o `ImageUploader` no painel

O painel (`panel-layout`, branch `dashboard`) não existe nesta base, então o componente está pronto e testado, sem rota.
No painel, em "Dados do estabelecimento" e no perfil do profissional:

```tsx
import { BusinessIllustration } from '@global/images/defaults/business-illustration'
import { ImageUploader } from '@components/image-uploader'
import type { BusinessDetailResponse } from '@lib/api/types'
import { api } from '@lib/api/client'
import { uploadFile } from '@lib/api/upload'

<ImageUploader
  id="business-cover"
  label="Capa"
  shape="cover"            // "square" para o logotipo, "round" para a foto do profissional
  current={business.cover}
  fallback={<BusinessIllustration category={business.category} />}
  onUpload={async (file, onProgress) =>
    (await uploadFile<BusinessDetailResponse>('/api/businesses/current/cover', file, { onProgress })).cover}
  onRemove={async () => {
    await api('/api/businesses/current/cover', { method: 'DELETE', auth: true })
  }}
/>
```

- Logotipo: troque `cover` por `logo` na rota e no retorno, com `shape="square"`.
- Foto do profissional: rota `/api/businesses/current/professionals/{id}/photo`, retorno `ProfessionalResponse.photo`,
  `shape="round"` e `fallback={<InitialsAvatar name={professional.displayName} />}`.
- Depois de enviar, invalide a consulta do estabelecimento (`queryKeys.business(id)`) para a vitrine pegar a imagem nova.

## 4.6 Conta e contexto (Onda 7A, 29/10)

Decisão de 22/09 (§2.0): conta única com troca de contexto explícita — "Consumidor" ou "Painel: Estúdio Duartina".

- **`GET /api/users/me`** traz `hasCustomerProfile` e `businesses` (vínculos ativos, com nome e papel).
- **Entrada** (`lib/api/context.ts#chooseEntry`): só estabelecimento → `#/panel/requests`; os dois → o último contexto
  usado (`localStorage` `vagoo-last-context`, por conta, com `try/catch`), o painel na primeira vez; vários
  estabelecimentos sem nada lembrado → `#/context`; quem veio de uma tela de consumidor (o `redirect`) volta para ela.
  "Sou estabelecimento" na tela de entrar pede o painel, e um `redirect` para `#/panel/*` (link do e-mail ao dono)
  também: depois de entrar, volta para ele. Sair pelo menu esquece o contexto lembrado e leva à Home (a sessão marca
  `signedOut`, só em memória, para os guards não mandarem a "Entrar"); sessão perdida (refresh recusado) leva a
  "Entrar" e volta para a tela.
- **Conta dona e consumidora:** o perfil de consumidor do dono é criado como o de qualquer conta
  (`POST /api/customers/me`, no contexto de consumidor); o seed não cria essa conta — o README mostra como.
- **Troca:** `POST /api/users/me/context` e o novo access token vai para a sessão (`lib/zustand/session`, campo
  `context`). O refresh devolve token de consumidor: `client.ts` pede o contexto de novo logo depois; se o vínculo
  acabou, a conta volta a consumidor.
- **Onde troca:** menu da conta na barra superior e no rodapé da barra lateral do painel (`components/account-menu`,
  `Menu` do Base UI); no celular, "Perfil" (consumidor) abre `#/context`, e "Mais" (painel) abre `#/panel/more`
  (desde a 7D), que lista as outras seções e leva à conta em `#/context`.
- **Guards:** `#/panel/*` exige contexto de estabelecimento (sem sessão → entrar; como consumidor → `#/context`, que
  diz "Esta conta não tem um estabelecimento" quando é o caso). Agendar, "Pedido enviado" e "Meus agendamentos" no
  contexto de estabelecimento levam a `#/context` ("troque para consumidor"). No mesmo contexto, a barra superior perde
  busca, localização e "Meus agendamentos" e ganha "Voltar ao painel".
- **Backend:** o token do painel não agenda como consumidor (403) e o dono não agenda no próprio estabelecimento (409).

## 4.7 Gestão do estabelecimento (Onda 7D, 29/10)

Só o dono. O menu do profissional não mostra estas seções, e o endereço digitado volta para a agenda
(`router/require-owner.tsx`); a API recusa com 403 `auth.forbidden` do mesmo jeito (`RequireOwner` nos comandos).

| Tela | Rota | O que faz | Limites que a tela aplica antes da API |
|---|---|---|---|
| Serviços | `#/panel/services`, `…/new`, `…/{id}` | Lista, ativa/desativa (pela edição, com `isActive`), cria e edita com o cadastro do Rafael (tela 11); depois de gravar, liga e desliga os profissionais | duração 1–480 min, intervalos 0–120, passo 5 até a duração, preço ≥ 0 (`Service.cs`) |
| Profissionais | `#/panel/professionals` | Lista só quem tem perfil público, convida (o perfil nasce no aceite), edita perfil, ativa/desativa, serviços de cada um, perfil completo só com consentimento | nome obrigatório |
| Jornadas e bloqueios | `#/panel/schedules` | Jornada semanal de um profissional por vez; bloqueio em dois passos: prévia (`affected-appointments`) e, com agendamentos, manter ou cancelar todos com motivo | fim depois do início; data final depois da inicial; turno extra com profissional |
| Fotos | `#/panel/photos` | Logotipo, capa e foto de cada profissional ativo, com o `ImageUploader` (§4.5) | JPEG, PNG ou WebP, até 5 MB (o `ImageUploader` confere) |
| Configurações | `#/panel/settings` | Política de agendamento: confirmação automática e os quatro prazos; o fuso aparece e não muda | prazo do pendente 1–72 h, antecedência 0–72 h, horizonte 1–365 dias, cancelamento 0–48 h (`Business.cs`) |
| Mais (celular) | `#/panel/more` | As seções fora das abas e a conta | — |

- **Categoria sensível:** não há categoria por serviço; ela é do estabelecimento (ADR-015). Com `category = Saude`
  (`RequiresSensitiveHandling`), a lista e o cadastro de serviço avisam que nome e descrição vão para a vitrine
  pública e não devem citar paciente.
- **409:** nesta área só a jornada responde 409 (`work_schedule.overlaps`, faixa cruzada), mostrado na gaveta. Os
  erros de serviço e de profissional são 400/404, com mensagem própria; um 404 diz que a lista foi atualizada.
- **Ordem das gravações do serviço:** primeiro o serviço, depois os vínculos. Se um serviço novo foi criado e um
  vínculo falhou, a tela abre a edição dele (salvar de novo não duplica).
- **Menu:** Avaliações e Relatórios saíram da lateral e da navegação inferior (não há backend; `Reputation` está
  fora do recorte) em vez de ficarem com "Em breve". Fotos entrou. Ícones do lucide, iguais na lateral, nas abas e
  no "Mais".

## 4.8 Acabamento do painel (Onda 7CF, 29/10)

- **Imagens:** a lateral do painel e "Revise seu pedido" mostram o logotipo (sem ele, a ilustração da categoria); a
  lista de Profissionais mostra a foto. Depois de enviar ou remover em Fotos, o cache do painel e o público
  (`['businesses']`: vitrine, busca) são invalidados. O backend já gravava as três variantes antes de responder, com
  nome novo a cada envio (teste P11), então o cache imutável de `/media` é seguro.
- **Serviço:** duração, intervalos e passo por seletor (múltiplos do passo, limites do domínio) e aviso de minutos
  soltos com a duração sugerida; preço com máscara em reais, em centavos.
- **Conta:** com um contexto só, o botão mostra o nome da pessoa, e a tela de conta não lista "Entrar como".
- **Agenda:** Dia, Semana e Mês, com filtros por profissional (só o dono), status, serviço e nome, na URL
  (`#/panel?view=&pro=&status=&service=&q=`). Semana e mês leem `GET …/appointments?date=&to=`. Sem visão de ano:
  não há agregado no backend.
- **Minha conta** (`#/account`, exige sessão, qualquer contexto): trocar o nome, ver o e-mail, trocar a senha pedindo a
  atual e sair. Entra pelo menu da conta e pela tela "Sua conta" (7A). Depois de trocar a senha, a sessão nova é
  guardada e, com o painel aberto, o contexto é pedido de novo. **Fora:** telefone (o `User` não tem o campo; exigiria
  migration e dado pessoal novo), trocar o e-mail e excluir a conta.
- **Refresh depois de sair ou trocar a senha:** token encerrado sem substituto é só inválido (401
  `auth.invalid_refresh_token`), não reuso. Antes, o outro aparelho, ao tentar renovar, derrubava a sessão nova. O
  reuso de token rotacionado continua derrubando todas as sessões.
- **Horizonte:** Configurações oferecem 30, 60, 90 ou 180 dias (a API aceita de 1 a 365). Um pedido para além do
  horizonte é recusado pelo backend; marcar o Natal em outubro precisa de pelo menos 90 dias.

## 4.9 Uma origem só e demonstração pública (Onda 7H, 31/10)

- **Base da API:** `VITE_API_BASE_URL` vazio é o padrão (Dockerfile e compose). O app chama `/api/…` e as imagens
  `/media/…` na própria origem; o nginx do `web` repassa os dois para a API com `Host`, `X-Forwarded-For` e
  `X-Forwarded-Proto`. Absoluta só para Capacitor, Tauri ou API em outro endereço (rebuild). No `bun run dev`, o Vite
  repassa `/api` e `/media` para `DEV_API_PROXY` (padrão: a API do `dotnet run`). Teste: `api/base/same-origin.test.ts`.
- **Mídia:** `mediaUrl` continua igual: caminho relativo ganha a base (vazia → fica relativo, servido pelo proxy);
  URL absoluta passa direto.
- **Saúde pelo mesmo endereço:** `GET /api/health` no nginx vai para o `/health` da API.
- **Upload:** o nginx aceita até 6 MB por requisição (a API recusa acima de 5 MB de arquivo, como antes).
- **CSP do site** (nginx): `connect-src 'self'` e `img-src 'self' data: blob:`; o script inline do tema no `index.html`
  entra por hash — mudou o script, mude o hash no `nginx.conf` (o teste acusa). As respostas da API mantêm a CSP
  fechada delas (`default-src 'none'`); o nginx não duplica cabeçalho em `/api/` e `/media/`.
- **Atrás do proxy:** a API lê o IP real do `X-Forwarded-For` só das redes em `ForwardedHeaders:KnownNetworks`
  (o limitador de login conta por pessoa) e o esquema do `X-Forwarded-Proto` (HSTS quando a origem foi HTTPS).
- **CORS:** o site não precisa mais dele (mesma origem). A origem `http://localhost:8080` continua liberada para quem
  chama a 8081 direto.
- Sem mudança de rota nem de JSON. Guia de operação: `docs/operacao/demo-publica.md`.

## 4.10 Cadastro do estabelecimento (ondas finais, 04/11) — **backend escrito sem Docker, não verificado**

Ciclo e regra: ADR-028. Todas as rotas `current/*` exigem o contexto de estabelecimento com papel `Owner`.

| Rota | Quem | O que faz |
|---|---|---|
| `POST /api/businesses` | conta logada | cria o estabelecimento em `Draft` e o vínculo `Owner`. **409 `business.account_limit_reached`** no 4º; limite de 5 por hora por conta (429) |
| `POST /api/businesses/current/terms` `{ version }` | Owner | aceita os termos (data e versão); a checklist exige |
| `PUT /api/businesses/current/responsible` `{ name, council, councilNumber, councilState }` | Owner, só Saúde | `council`: `Crm`, `Crp`, `Crefito`, `Crn`, `Crefono`, `Cro`. Outra categoria: `business.responsible_only_for_health` |
| `POST /api/businesses/current/publish` | Owner, não-Saúde | `Draft → Active` com a checklist completa. Saúde: **409 `business.requires_review`** |
| `POST /api/businesses/current/submit` | Owner | `Draft → PendingReview` com a checklist completa (`business.activation_checklist_incomplete` + `missing`) |
| `GET /api/businesses/current` | Owner | agora traz `statusReason` (motivo da suspensão ou da reprovação), `termsAccepted`, `responsibleInformed` |
| `POST /api/businesses/{id}/reports` `{ reason }` | **anônimo** | denuncia estabelecimento **ativo** (5 a 500 caracteres). 204; 404 se não ativo; 5 por hora por IP (429) |
| `GET /api/admin/businesses?status=&category=` | Admin | fila por status (padrão `PendingReview`) e categoria |
| `GET /api/admin/businesses/{id}` | Admin | detalhe com `checklist`, `responsible` (**só aqui**), `suspensionReason`, `suspendedByUserId`, `suspendedAt`, `termsAcceptedAt`, `termsVersion` |
| `POST /api/admin/businesses/{id}/suspend` `{ note }` | Admin | **o motivo é obrigatório** (`business.suspension_requires_reason`) |
| `GET /api/admin/businesses/reports?status=Open\|Resolved` | Admin | fila de denúncias |
| `POST /api/admin/businesses/reports/{reportId}/resolve` `{ note? }` | Admin | encerra a denúncia (409 se já resolvida); suspender é uma decisão à parte |

- **Checklist** (`ActivationChecklist`): `terms` (todas as categorias), `responsible` (só Saúde), localização confirmada,
  ≥ 1 profissional, ≥ 1 serviço com profissional habilitado, ≥ 1 jornada.
- **"Reprovado" não é status:** é `Draft` com `verificationLevel: "Rejected"`; o motivo vem em `statusReason`.
- **Privacidade:** o registro no conselho só sai para o Admin; o dono recebe `responsibleInformed`; documento, registro e
  denunciante nunca vão para log. Denúncia guarda a conta só se logada, nunca o IP.
- **E-mails ao dono** (outbox): cadastro recebido (Saúde), aprovado, reprovado com motivo, suspenso com motivo, publicado.
  Em Saúde o assunto não cita o nome do estabelecimento nem serviço.
- **Busca:** serviço e preço aparecem em todas as categorias, Saúde inclusa (ADR-024).
- **`GET /api/businesses/current/checklist` devolve `PagedResult`** (uma página com todos os itens), como manda a
  ADR-010; o serviço do frontend lê `.items`. Corrigido na Fase 4 (o teste de paginação estava vermelho).

## 4.11 Convites de equipe (Fase 4, bloco 1, 04/11) — **backend escrito sem Docker, não verificado**

Ciclo e regra: ADR-029. **Desde 05/11 o convite é o único caminho para outra pessoa entrar na equipe**: o registro de
profissional nasce no aceite, e o atendente nunca tem um. `POST /api/businesses/current/professionals` só aceita
`isMe: true` (o perfil do próprio dono); com `isMe: false` responde **409** `professional.cannot_create_without_invitation`.
Papéis convidáveis: `Professional` e `Attendant` (novo papel; o `Owner` nunca é convidável).

| Rota | Quem | O que faz |
|---|---|---|
| `POST /api/businesses/current/invitations` `{ name, email, role, professionalId? }` | Owner | 201 `InvitationResponse`. **409** `business.seat_limit_reached`, `invitation.already_pending`, `invitation.already_member`, `invitation.professional_not_linkable`. 400 `invitation.role_invalid`. 30 por hora por conta (429) |
| `GET /api/businesses/current/invitations?page=&pageSize=` | Owner | `PagedResult<InvitationResponse>` só dos **pendentes** |
| `GET /api/businesses/current/seats` | Owner | `{ used, limit }`: contas ativas + convites pendentes contra o `SeatLimit` (15) |
| `GET /api/businesses/current/members?page=&pageSize=` | Owner | `PagedResult<TeamMemberResponse>` `{ membershipId, name, role }`: quem tem conta ativa no estabelecimento. A seção Equipe (`#/panel/members`) |
| `POST /api/businesses/current/invitations/{id}/resend` | Owner | token novo e prazo novo (o link antigo deixa de valer). Expirado volta a ocupar vaga |
| `DELETE /api/businesses/current/invitations/{id}` | Owner | revoga. 204. Convite de outro estabelecimento responde **404** |
| `POST /api/invitations/preview` `{ token }` | **anônimo** | `{ businessName, inviterName, inviteeName, email, role, accountExists, termsVersion, termsRequired }` |
| `POST /api/invitations/accept` `{ token, acceptTerms }` | conta logada | a conta precisa ter o e-mail do convite (**403** `invitation.email_mismatch`) |
| `POST /api/invitations/accept-new-account` `{ token, fullName, password, acceptTerms }` | **anônimo** | cria a conta com e-mail já confirmado e aceita. **409** `invitation.account_exists` se já há conta. Depois, o frontend faz o login com as mesmas credenciais |

- **Token no corpo, nunca na URL** (log de acesso, histórico). Rotas do link: 20 por hora por IP (429).
- **Erros do link:** `invitation.not_found` (404, token que não existe ou de outro estabelecimento), `invitation.expired`
  e `invitation.revoked` (**410**), `invitation.already_used` (409), `invitation.terms_required` (400, só `Professional`).
- `AcceptedInvitationResponse` = `{ businessId, businessName, role }`. Depois do aceite o frontend troca de contexto
  (`switch-context`) para o novo estabelecimento.
- **E-mail** pelo outbox, link `#/convite?token=`. O texto cita o estabelecimento e o papel, nunca categoria nem serviço.
- **Migration `AddBusinessInvitation`** (não aplicada): tabela `tenancy.business_invitation` e `seat_limit` 1 → 15.

## 4.12 Papel Atendente (Fase 4, bloco 2, 04/11) — **backend escrito sem Docker, não verificado**

Regra: ADR-030. O token de contexto passa a levar `ctx: "Attendant"` (o `switch-context` devolve `role: "Attendant"`).

| Rota (todas em `/api/businesses/current/…`) | Dono | Atendente | Profissional |
|---|---|---|---|
| `appointments` (agenda do dia), `appointments/pending`, `confirm`, `reject`, `cancel`, `complete`, `no-show`, `counter` | todos | **todos** | só os próprios |
| `schedule-exceptions` (bloqueios, férias), `schedule-exceptions/affected-appointments` | sim | **sim**, de todos | **só os próprios** (`professionalId` = o seu perfil; o de outro ou o do estabelecimento todo dá 403) |
| `GET/PUT professionals/me` `{ specialty, bio }` | só com perfil ligado | **403** (não tem perfil) | **sim**, o próprio. Nome e situação seguem do dono; a foto usa `PUT professionals/{id}/photo` |
| `professionals` e `services` (GET), `work-schedules` (GET), `schedule-exceptions` (GET) | sim | sim | sim |
| `work-schedules` (POST/PUT/DELETE), `services` (POST/PUT e vínculo com profissional), `professionals` (POST/PUT) | sim | **403** | 403 |
| `professionals/{id}/photo` | sim | **403** | só a própria |
| `GET current`, `checklist`, `scheduling-policy`, `address`, `location`, `logo`, `cover`, `submit`, `publish`, `terms`, `responsible` | sim | **403** | 403 |
| `invitations`, `seats` | sim | **403** | 403 |
| `/api/admin/*` | 403 | 403 | 403 |

- O atendente **não** agenda como consumidor no contexto do painel (`appointment.customer_context_required`, 403).
- **Para o frontend:** o painel do atendente não pode chamar `GET current` nem `checklist` (403). Para o nome do
  estabelecimento use `GET /api/users/me`.

## 4.13 Perfil público sempre ligado e a declaração do dono (Fase 4, bloco 3, 04/11) — **backend escrito sem Docker, não verificado**

Decisão e justificativa: ADR-031. **Quebra de contrato** (o frontend desta branch já acompanha):

| Antes | Agora |
|---|---|
| `ProfessionalResponse.isPubliclyVisible`, `hasPublicProfileConsent` | **Removidos.** Entram `authorizationDeclared` (o dono já declarou) e `registration` (registro profissional, opcional) |
| `UpdateProfessionalRequest.showFullProfile` | **Removido.** Entra `authorizationDeclared` (bool, padrão `false`) e `registration` (opcional) |
| `CreateProfessionalRequest` | ganha `authorizationDeclared` e `registration` (opcionais) |
| `PUT/DELETE professionals/{id}/public-profile-consent` | **Removidas** (404) |
| `PublicProfessionalResponse`: só o nome sem consentimento | **Sempre** nome, `specialty`, `bio`, `photo` e `registration` de todo profissional **ativo** |
| `PUT professionals/me` `{ specialty, bio }` | ganha `registration` (opcional) |

- **Declaração do dono:** "Declaro ter autorização desta pessoa para exibir estes dados publicamente." Para salvar a **bio**
  de quem **não tem conta**, `authorizationDeclared: true` é obrigatório na primeira vez (400 `professional.declaration_required`).
  Registra-se quem declarou, quando e a versão do texto (`declaracao-dono-2026-11-rascunho`, sem IP). Declarar de novo atualiza.
- **Foto de quem não tem conta, enviada pelo dono:** exige a declaração antes (400 `professional.declaration_required`).
- **Quem tem conta** controla a própria bio e foto e **não** depende da declaração.
- **Desativar nunca é barrado** pela declaração (inclui cadastros anteriores a ela). Desativado, o profissional sai da vitrine na hora.
- **Migration `ReplaceProfessionalConsentWithDeclaration`** (não aplicada): remove `is_publicly_visible` e
  `public_profile_consent_at` e cria `authorization_declared_at`, `authorization_declared_by_user_id`,
  `authorization_declaration_version` e `registration`. **Efeito de dados:** depois dela, todo profissional ativo, com ou sem
  consentimento antigo, passa a aparecer completo na vitrine.

## 4.14 Telas da equipe (Fase 4, 04/11) — **frontend escrito sem navegador, não verificado**

Sem rota nova na API; o frontend passa a usar o que as §4.11 a §4.13 já documentam:

| Tela | Rota do frontend | Quem | API |
|---|---|---|---|
| Convidar, pendentes, reenviar, revogar, vagas | seção **Convites** em `#/panel/professionals` | Owner | `invitations`, `invitations/{id}/resend`, `DELETE invitations/{id}`, `seats` |
| Folgas e bloqueios | `#/panel/blocks` | Attendant (todos e estabelecimento inteiro) e Professional (só os próprios) | `schedule-exceptions`, `…/affected-appointments` |
| Meu perfil | `#/panel/profile` | Professional | `professionals/me` (GET/PUT) e `professionals/{id}/photo` |
| Registro profissional | Editar (dono) e Meu perfil, só em Saúde | Owner e Professional | campo `registration` |

- O menu esconde por papel (`hiddenSectionsFor`): o dono não vê "Folgas e bloqueios" (tem Jornadas) nem "Meu perfil".
- O profissional descobre o próprio id por `professionals/me` e filtra a lista de bloqueios por ele no cliente; o servidor
  recusa o resto com 403.

## 4.15 Foto de serviço (Fase 4, bloco 5, 04/11) — **backend e frontend escritos sem Docker, não verificados**

| Rota | Quem | O que faz |
|---|---|---|
| `PUT /api/businesses/current/services/{id}/image` | **só o Owner** | `multipart/form-data`, campo `file`. As mesmas validações do logotipo (ADR-023): assinatura do arquivo (não o nome nem o `Content-Type`), 5 MB, JPEG/PNG/WebP, EXIF removido, três variantes WebP, nome GUID. Devolve `ServiceResponse` com `photo`. 20 envios por hora por conta |
| `DELETE /api/businesses/current/services/{id}/image` | Owner | remove e apaga os arquivos. Serviço de outro estabelecimento: 404 |

- `photo` (`ImageSet | null`) entra em `ServiceResponse` (painel) e `PublicServiceResponse` (vitrine). **Aditivo**: nada quebra.
- Frontend: `ImageUploader` em "Editar serviço" (no cadastro: "Salve o serviço primeiro"); a vitrine mostra a foto ao lado do
  serviço, e o ícone da categoria quando não há. Em Saúde, aviso no envio: não enviar imagem de pacientes.
- Migration `AddServiceImage` (não aplicada): `catalog.service.image_key varchar(200) NULL`.
- **Mostrar foto na vitrine (05/11):** `showPhotoInShowcase` (`bool`, padrão `true`) entra em `SaveServiceRequest` e
  `ServiceResponse`. Desligado, `PublicServiceResponse.photo` e a foto do serviço em `GET /api/professionals/{id}` saem
  nulas; o dono continua recebendo `photo` no painel. Migration `AddServiceShowPhotoInShowcase` (não aplicada):
  `catalog.service.show_photo_in_showcase boolean NOT NULL DEFAULT TRUE`.

## 4.16 Página pública do profissional, remoção de perfil e sair do estabelecimento (Fase 4, bloco 4, 04/11) — **escrito sem Docker e sem navegador, não verificado**

| Rota | Quem | O que faz |
|---|---|---|
| `GET /api/professionals/{id}` | **anônimo** | `ProfessionalPageResponse`: `displayName`, `specialty`, `bio`, `registration` (só se informado), `photo`, `business { id, name, addressLine, category, timeZone }` e `services[]` com o preço e a duração **do profissional** (override aplicado) e a foto do serviço. **404** para profissional inativo, estabelecimento fora da vitrine ou id que não existe: os três respondem igual |
| `POST /api/professionals/{id}/removal-requests` `{ reason, contact? }` | **anônimo** | 204. Motivo de 5 a 500 caracteres (400 `removal_request.reason_invalid`); contato opcional de até 150. **5 por hora por IP** (429). E-mail aos donos pela outbox (em Saúde o assunto não cita nome) e entra na fila do Admin. **Nada é desativado sozinho.** 404 se o perfil não é público |
| `GET /api/admin/professional-removals?status=Open\|Resolved` | Admin | fila paginada; traz `contact` (só o Admin e o dono veem) |
| `POST /api/admin/professional-removals/{id}/resolve` `{ note? }` | Admin | encerra (409 se já resolvido). Desativar o perfil é decisão do dono |
| `POST /api/businesses/current/leave` | Professional ou Attendant | 204. Remove o próprio vínculo; o perfil de profissional é **desativado** e sai da vitrine na hora; o histórico de agendamentos permanece. **O dono recebe 409** `business_membership.cannot_remove_owner`. Depois, o frontend volta ao contexto de consumidor |

- Frontend: `#/profissional/:professionalId` (foto ou iniciais, serviços, horários de hoje e amanhã, estabelecimento,
  "Solicitar remoção deste perfil"); a aba **Profissionais** da página do estabelecimento deixa de ser "Em breve" e lista os
  ativos, cada um com "Ver perfil"; aba **Remoções de perfil** em `#/admin/estabelecimentos`; **Sair do estabelecimento** em
  Meu perfil (profissional) e em "Mais" (profissional e atendente, no celular).
- O espaço da **nota do profissional** existe e fica escondido até haver média (módulo de avaliações).
- Migration `AddProfessionalRemovalRequest` (não aplicada): `people.professional_removal_request`.

## 4.17 Avaliações (Fase 8, fatia 1 de 5, 04/11) — **backend escrito sem Docker, não verificado** (ADR-032, Proposto)

| Rota | Quem | O que faz |
|---|---|---|
| `GET /api/appointments/{id}/review` | consumidor | `MyReviewResponse` com `canEdit`. 404 `review.not_found` se não existe ou é de outra pessoa |
| `POST /api/appointments/{id}/review` `{ rating, professionalRating?, comment? }` | consumidor | 201. Agendamento **concluído**, do próprio consumidor, em até 30 dias. **10 por hora por conta** (429) |
| `PUT /api/appointments/{id}/review` (mesmo corpo) | consumidor | 200. **Uma única edição**, em até 7 dias |
| `GET /api/reviews/mine?page&pageSize` | consumidor | `PagedResult<MyReviewResponse>` |
| `GET /api/businesses/{id}/reviews?page&pageSize` | **anônimo** | `PagedResult<PublicReviewResponse>`, mais recentes primeiro, sem as ocultas. 404 se o estabelecimento não está na vitrine |
| `GET /api/businesses/{id}/rating` | **anônimo** | `{ average, count, distribution[5], isNew }`. `average` é nulo e `isNew` verdadeiro com menos de 3 avaliações |
| `GET /api/professionals/{id}/reviews` e `/rating` | **anônimo** | idem, só com as notas em que o consumidor avaliou o profissional. 404 para profissional inativo |

- `PublicReviewResponse`: `id`, `rating`, `professionalRating?`, `comment?`, `reviewerName` (**"Ana S."**), `serviceName?`
  (**nulo em Saúde**), `reviewedAt`. Nunca traz id de consumidor nem de agendamento.
- Erros: 400 `review.rating_invalid` / `review.comment_too_long`; 403 `appointment.customer_context_required` (token de
  painel) e `review.not_allowed` (dono ou equipe do estabelecimento); 404 `review.not_found`; 409 `review.not_completed`,
  `review.window_expired`, `review.already_reviewed`, `review.already_edited`, `review.edit_window_expired`; 503
  `review.contention_try_again` (duas avaliações no mesmo alvo ao mesmo tempo: tentar de novo).
- **Limitações registradas:** o dono não responde; o consumidor não apaga a avaliação.
- Migration `AddReputation` (não aplicada): `reputation.review` e `reputation.rating_summary`.

### 4.17.4 Moderação (Fase 8, fatia 5 de 5) — **backend rodado com Docker; telas não vistas no navegador**

| Rota | Quem | O que faz |
|---|---|---|
| `GET /api/businesses/current/reviews?page&pageSize` | dono | `PagedResult<OwnerReviewResponse>`: a avaliação e `reported` |
| `POST /api/businesses/current/reviews/{id}/report` `{ reason }` | dono | 204. Motivo de 5 a 500 caracteres. Uma denúncia por avaliação (409 `review.already_reported`). Outro estabelecimento: 404. **Nada sai do ar sozinho** |
| `GET /api/admin/reviews?status=Open\|Hidden` | Admin | fila: denúncias abertas, as mais antigas primeiro, ou as ocultas |
| `POST /api/admin/reviews/{id}/hide` `{ reason }` | Admin | oculta: sai da lista pública e da média na mesma transação; grava quem decidiu, quando e o motivo (obrigatório). Fecha a denúncia |
| `POST /api/admin/reviews/{id}/unhide` | Admin | reexibe: volta à lista e à média |
| `POST /api/admin/reviews/{id}/dismiss-report` | Admin | mantém no ar e fecha a denúncia (409 `review.no_open_report` sem denúncia aberta) |

- Telas: **Avaliações** no painel, só do dono (`#/panel/reviews`), e a aba **Avaliações** em `#/admin/estabelecimentos`.
- A fila do Admin não traz id de consumidor: decide-se pelo texto, com o nome abreviado.
- Migration `AddReviewReport` (não aplicada): `reported_by_user_id`, `reported_at`, `report_reason`, `report_closed_at`.

### 4.17.3 E-mail "Como foi?" (Fase 8, fatia 4 de 5) — **escrito sem Docker, não verificado**

- **Quando:** o estabelecimento conclui o agendamento (`POST …/complete`). Vai pela **outbox**, no mesmo `SaveChanges` da
  conclusão. Balcão sem conta e "falta" não recebem.
- **Conteúdo:** convite para avaliar, prazo de 30 dias, edição única em 7, botão **Avaliar atendimento** (`#/appointments`).
- **Saúde (LGPD, Art. 11):** assunto "Como foi o seu atendimento?" e prévia "Abra para avaliar." **sem** estabelecimento, serviço
  nem categoria; o corpo também não traz o serviço e avisa para não escrever dado de saúde.
- **Seed:** avaliações nos 3 primeiros estabelecimentos (5, 3 e 2 avaliações: média, média no limite e "Novo") e um
  atendimento concluído sem avaliação para `consumidor@example.com`.

### 4.17.2 Telas das avaliações (Fase 8, fatia 3 de 5) — **frontend escrito sem navegador, não verificado**

- **Componentes novos:** `StarRatingInput` (grupo de opções `role="radiogroup"`, 5 estrelas de 44 px, setas trocam a nota),
  `RatingLabel` ("★ 4,8 (12)" ou **"Novo"**), `ReviewsSection` (nota, distribuição e lista paginada, com carregando, erro,
  vazio e sucesso) e `ReviewDrawer` (gaveta "Avaliar atendimento" / "Editar avaliação").
- **Meus agendamentos:** concluído e dentro de 30 dias → **Avaliar atendimento**; já avaliado e ainda editável (edição única,
  7 dias) → "Você avaliou: N de 5" e **Editar avaliação**. O formulário avisa que a avaliação é pública e, em Saúde, para não
  escrever dado de saúde.
- **Busca:** chip **Melhor avaliados** (`sort=rating` na URL); o cartão mostra a nota ou "Novo".
- **Página do estabelecimento:** o cabeçalho mostra a nota ou "Novo"; a aba **Avaliações** traz a nota, a distribuição e a lista
  paginada. **Página do profissional:** o espaço da nota passou a aparecer e há a seção "Avaliações de NOME".
- O filtro `minRating` existe no backend e **não tem controle na tela** (cortado de propósito nesta rodada).
- Erros traduzidos: `review.*` em `api/base/errors.ts`.

### 4.17.1 Busca por nota (Fase 8, fatia 2 de 5) — **escrito sem Docker, não verificado**

| Parâmetro / campo | Detalhe |
|---|---|
| `sortBy=rating` | melhores primeiro; empate de média decidido pelo número de avaliações. Estabelecimento **sem média** ("Novo", menos de 3 avaliações) vem **depois**, na ordem de distância |
| `minRating=1..5` | só estabelecimentos com média **maior ou igual**. Os "Novos" ficam de fora (não se afirma uma nota que não existe). Fora de 1 a 5: 400 `search.min_rating_invalid` |
| `ratingAverage` (novo, aditivo) | média com 1 casa; **nulo** enquanto "Novo" |
| `ratingCount` (novo, aditivo) | quantas avaliações; 0 se nenhuma. A tela mostra "Novo" quando `ratingAverage` é nulo |

- Sem `sortBy=rating` nem `minRating`, a nota só é lida dos itens da página exibida (uma consulta a mais, por ids).
- A busca lê a nota pelo contrato `IReputationDirectory`; o módulo Tenancy não conhece `RatingSummary`.
- Os campos novos são aditivos: o frontend atual os ignora.

## 4.18 Documento do cadastro, Versão B (04/11) — **backend rodado com Docker; tela não vista no navegador** (ADR-028)

`POST /api/businesses` `{ name, document, category, documentType?, isMei? }`:

- Toda categoria aceita CPF ou CNPJ (numérico ou alfanumérico). `documentType` é `Cpf` ou `Cnpj`, conferido com o documento; sem
  ele, vale o que o documento é. `isMei` é informativo.
- 400: `document.expected_cpf`, `document.expected_cnpj`, `document.type_invalid`, `business.mei_requires_cnpj`, além dos que já
  existiam (`document.required`, `document.invalid_length`, `document.invalid_check_digit`).
- `GET /api/businesses/current` e o detalhe do Admin ganham `documentType` e `isMei`. **Nenhuma resposta pública traz documento.**
- Migration `AddBusinessDocumentType` (não aplicada): `document_type`, `is_mei`, `ck_business_mei_requires_cnpj`; quem já existe
  recebe o tipo pelo tamanho do documento.

## 4.19 Consentimento para agendar em Saúde (05/11)

- `GET /api/consents/versions` (anônima) devolve `{ sensitiveScheduling, sensitiveSchedulingText }`: a versão vigente e **o texto** (campo novo, aditivo). Rascunho em `docs/legal/consentimento-agendamento-saude.md`.
- `POST /api/consents` `{ purpose, version }`, `GET /api/consents` e `DELETE /api/consents/{purpose}` já existiam; agora têm tela.
- "Revise seu pedido": `compliance.consent_required` não vira toast, e sim o bloco de consentimento; ao aceitar, grava e reenvia com a mesma chave de idempotência.

## 5. Resumo para fechar o lado do frontend

1. Ler `alternatives` do 409 no `client.ts` para a tela de "horário ocupado".
2. Traduzir `appointment.contention_try_again` (503: "tente de novo").
3. Painel: bloqueios desenhados na grade da agenda, visão de ano (sem agregado no backend), histórico do consumidor
   no pedido e a remarcação (sem backend).
4. Gestão: preço e duração próprios por profissional no serviço; consentimento do perfil público pelo próprio
   profissional (depende do login de profissional, 5D); cadastro, endereço e envio para análise do estabelecimento.
