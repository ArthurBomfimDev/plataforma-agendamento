# Contrato API × frontend

> **Data:** 2026-10-27, atualizado nas Ondas 5A, 5B, 6A, 6B, 6C, 6D (28/10) e 7A (29/10). **Lado da API:** `backend/src/Core/Booking.Arguments` em `698fa2c` (Ondas 1 a 3
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
| `GET /api/businesses/current/appointments/pending` | `panelApi.pending` | ✅ desde a 7A |
| `POST …/appointments/{id}/confirm` · `reject` · `cancel` · `complete` · `no-show` | `panelApi.confirm` … `noShow` | ✅ desde a 7A |
| `POST /api/businesses/current/appointments/counter` | `panelApi.counter` | ✅ desde a 7A |
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
- **Filtros na tela:** categoria e termo como chips removíveis; "Até 5 km" (`radiusKm` 5 ou 20); "Até R$ 50/100/200"
  (`maxPriceCents`); ordenar por "Mais perto" ou "Menor preço" (`sortBy`).
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
  `Menu` do Base UI); no celular, "Perfil" (consumidor) e "Mais" (painel) abrem `#/context`.
- **Guards:** `#/panel/*` exige contexto de estabelecimento (sem sessão → entrar; como consumidor → `#/context`, que
  diz "Esta conta não tem um estabelecimento" quando é o caso). Agendar, "Pedido enviado" e "Meus agendamentos" no
  contexto de estabelecimento levam a `#/context` ("troque para consumidor"). No mesmo contexto, a barra superior perde
  busca, localização e "Meus agendamentos" e ganha "Voltar ao painel".
- **Backend:** o token do painel não agenda como consumidor (403) e o dono não agenda no próprio estabelecimento (409).

## 5. Resumo para fechar o lado do frontend

1. Ler `alternatives` do 409 no `client.ts` para a tela de "horário ocupado".
2. Traduzir `appointment.contention_try_again` (503: "tente de novo").
3. Painel: bloqueios na agenda, visão da semana, histórico do consumidor no pedido e a remarcação (sem backend).
