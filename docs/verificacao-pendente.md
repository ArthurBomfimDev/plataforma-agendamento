# Verificação pendente (rodar em casa, com Docker)

Checklist único do que foi escrito **sem Docker e sem navegador** nas ondas finais (04/11/2026) e ainda não tem prova.
Rode na ordem dos PRs. Marque cada item; se algo falhar, abra o PR correspondente e descreva o que viu.

> Nenhuma credencial neste arquivo. As senhas vêm do `.env` local (não versionado).

## 0. Preparar a pilha isolada (uma vez por rodada)

```powershell
# Na raiz do repositório, na branch do PR que está verificando
./scripts/setup-env.ps1            # cria o .env com senha e chave aleatórias (apague o .env antigo antes)
# Acrescente ao .env (valores seus): WEB_PORT=8090  API_PORT=8091  DB_PORT=5499  MAILPIT_PORT=8095
#   MAILPIT_SMTP_PORT=1095  SEED_PASSWORD=<senha>  SEED_ADMIN_PASSWORD=<senha>
$env:COMPOSE_PROJECT_NAME = 'booking0'
docker compose up -d --build        # o serviço `migrations` aplica as migrations ao subir
$env:API_URL = 'http://localhost:8091'
bun scripts/seed-demo.ts            # lê SEED_PASSWORD / SEED_ADMIN_PASSWORD do ambiente
```

Para derrubar e apagar tudo ao fim: `docker compose down -v` (com o mesmo `COMPOSE_PROJECT_NAME`) e apague o `.env` de teste.
Site em `http://localhost:8090`; Mailpit (só local) em `http://localhost:8095`.

## 1. Testes automáticos que exigem Docker

```powershell
cd backend
dotnet test Booking.slnx            # inclui os de integração (Testcontainers / PostgreSQL)
dotnet format Booking.slnx --verify-no-changes
cd ../frontend
bun install --frozen-lockfile; bun run typecheck; bun run lint; bun run format:check; bun run test; bun run build
```

Esperado: tudo verde. **Se algum teste de integração novo falhar, é o primeiro sinal de erro de migration ou de regra.**

## 2. Por PR

### #33 — Fases 2 e 3 na branch de trabalho (CNPJ alfanumérico, publicar na hora, casca mobile)

| # | Passo | Esperado |
|---|---|---|
| 1 | `POST /api/businesses/current/publish` como dono de estabelecimento de **Beleza** completo (checklist feita) | 200, `status: Active`; aparece na busca |
| 2 | O mesmo para **Saúde** | 4xx com `business.requires_review`; segue Rascunho |
| 3 | O mesmo com profissional (não dono) | 403 |
| 4 | Cadastrar estabelecimento com CNPJ alfanumérico `12.ABC.345/01DE-35` (`POST /api/businesses`) | 201; `document` volta `12ABC34501DE35` |
| 5 | Celular (390 px), **claro e escuro**, sem sessão: Home, busca, estabelecimento, agendar, revisão | barra superior com logotipo, tema, **Entrar** e **Criar conta**; sem rolagem horizontal; alvos de toque ≥ 44 px |
| 6 | Tocar "Entrar" estando em `/search?term=…` | depois de entrar, volta para a mesma busca |
| 7 | Logado como consumidor: aba "Perfil" | abre Minha conta, com tema, Sair e (se tiver estabelecimento) **Meu painel** |
| 8 | Tocar **Sair** | pede confirmação ("Sair da conta?"); confirmar encerra a sessão |
| 9 | `dono.duartina@example.com` entra | abre o painel direto; "Meu painel" aparece no menu quando está como consumidor |
| 10 | Painel no celular, tela **Mais** | linha "Tema escuro" com o botão de 44 px |

### Busca tolerante (Fase 6, bloco 1)

| # | Passo | Esperado |
|---|---|---|
| 1 | `dotnet test Booking.slnx` — testes H7 e H8 de busca (contra PostgreSQL) | verdes; se algum quebrar, é o ajuste do radical |
| 2 | Na busca (Garça, raio de cidade): "barbeiro", "barbearia", "barba" | mesmas barbearias nos três |
| 3 | "manicuri", "unha", "massagista", "psicologa" | acham manicure, unha, massagem e psicologia, se houver no seed (o seed ainda não tem todos) |
| 4 | "advogado" | estado vazio |
| 5 | Resultado de um estabelecimento de **Saúde** | mostra o serviço, a duração e o preço, como em Beleza (decisão de 04/11). O serviço **não** aparece no e-mail, no `.ics` e (quando existirem) no feed e nas avaliações |

### Cadastro do estabelecimento, backend (Fase 3 — migration `AddOnboardingFields`)

```powershell
# 1. A migration é aplicada pelo serviço `migrations` ao subir a pilha (seção 0). Conferir:
docker compose exec db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "\d tenancy.business"'
# esperado: responsible_name, responsible_council, responsible_council_number, responsible_council_state,
#           suspension_reason, suspended_by_user_id, suspended_at, terms_accepted_at, terms_version (todas NULL nas linhas antigas)
# 2. Testes novos (escritos sem Docker): OnboardingTests P1 a P7 + os ajustes de AdminBusinessTests e TestWorld
cd backend; dotnet test tests/Booking.IntegrationTests --filter "FullyQualifiedName~Onboarding|FullyQualifiedName~AdminBusiness"
```

| # | Passo | Esperado |
|---|---|---|
| 1 | Suíte de integração inteira | verde. **O `TestWorld` agora aceita os termos (e informa o responsável em Saúde) antes do envio**: se algo antigo quebrar, comece por aí |
| 2 | `POST /api/admin/businesses/{id}/suspend` sem motivo | 400 `business.suspension_requires_reason` |
| 3 | Suspender com motivo, depois `GET /api/businesses/current` pelo dono | `statusReason` com o motivo |
| 4 | Quarto `POST /api/businesses` da mesma conta | 409 `business.account_limit_reached` |
| 5 | Estabelecimento de Saúde sem responsável tenta `submit` | 400 `business.activation_checklist_incomplete` com `responsible` em `missing` |
| 6 | Admin abre o detalhe de uma Saúde | vê `responsible`; o dono vê só `responsibleInformed: true`; a resposta pública nunca traz |
| 7 | **Seed** (`bun scripts/seed-demo.ts`) | conclui sem erro: o seed agora chama `POST current/terms` (e `PUT current/responsible` nas de Saúde) antes do `submit`. Não foi executado |

### Cadastro, backend — denúncia, e-mails de status e seed (migration `AddBusinessReport`)

```powershell
docker compose exec db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "\d tenancy.business_report"'
# esperado: id, business_id, reason, reporter_user_id, reported_at, status, resolved_by_user_id, resolved_at, resolution, created_at, updated_at
cd backend; dotnet test tests/Booking.IntegrationTests --filter "FullyQualifiedName~ReportAndAdminQueue"
```

| # | Passo | Esperado |
|---|---|---|
| 1 | Testes R1 a R5 (denúncia anônima e logada, fila só do Admin, rascunho não se denuncia, resolver uma vez, filtro de categoria, e-mails de status) | verdes |
| 2 | `curl -X POST http://localhost:8091/api/businesses/<id ativo>/reports -H "Content-Type: application/json" -d '{"reason":"teste de denúncia"}'` | 204 |
| 3 | O mesmo 6 vezes seguidas, do mesmo IP | a 6ª responde **429** |
| 4 | `GET /api/admin/businesses/reports` como Admin | lista a denúncia, sem IP |
| 5 | `bun scripts/seed-demo.ts` e abrir `http://localhost:8090/#/search` | a **Clínica Nova Esperança** (`dono.novo@example.com`) **não** aparece; os demais estabelecimentos são os mesmos de antes |
| 6 | Admin: `GET /api/admin/businesses?status=PendingReview&category=Saude` | traz a Clínica Nova Esperança, e só ela entre as de Saúde pendentes |
| 7 | Aprovar a Clínica Nova Esperança | ela passa a aparecer na busca; o dono recebe o e-mail "Seu estabelecimento foi aprovado" no Mailpit (`http://localhost:8095`) |
| 8 | Reprovar com motivo | e-mail "Seu cadastro precisa de ajustes" com "Motivo: …"; o **assunto não cita o nome da clínica** |
| 9 | Criar o 4º estabelecimento da mesma conta | 409 `business.account_limit_reached` |

### Cadastro do estabelecimento, frontend (assistente, faixa de status, Admin)

Escrito sem navegador: só teste de componente com API simulada. **Visual, 390 px e claro/escuro NÃO verificados.**

```powershell
# Pilha isolada (seção 0), seed rodado. Contas: dono.novo@example.com (Saúde em análise), admin@example.com,
# e uma conta nova para cadastrar (confirme o e-mail pelo Mailpit em http://localhost:8095).
```

| # | Passo (390 px **e** desktop, claro **e** escuro) | Esperado |
|---|---|---|
| 1 | Home → rolar até o fim | cartão "Tem um negócio?" com **Tenho um negócio** (alvo ≥ 44 px) |
| 2 | Logado: menu da conta → **Cadastrar meu estabelecimento**; e em Minha conta o mesmo botão | abre `#/cadastrar-estabelecimento` |
| 3 | Sem sessão, abrir `#/cadastrar-estabelecimento` | vai para "Entrar" e volta ao assistente |
| 4 | Passo 1: nome vazio → Continuar | erro "Informe o nome do estabelecimento." no campo |
| 5 | Passo 2 (Documento): texto "Regra do documento **em definição**"; digitar `123` | erro do formato; `12.ABC.345/01DE-35` é aceito |
| 6 | **Criar e continuar** | cria o rascunho (`POST /api/businesses`) e passa para o contexto dele; CNPJ repetido mostra "Já existe um estabelecimento…" |
| 7 | Passo 3: CEP `17400-000` → **Buscar CEP** | preenche rua/bairro/cidade/UF quando o CEP traz; CEP não achado mostra o aviso e deixa digitar |
| 8 | **Salvar e confirmar a localização** | `PUT address` + `PUT location`; endereço que não geocodifica mostra "Não foi possível localizar o endereço." |
| 9 | Categoria **Saúde**: passo "Responsável" | aparece só em Saúde; nome, conselho, número, UF; erro por campo |
| 10 | Revisão sem marcar os termos → Salvar | "Aceite os termos para continuar."; marcado, vai ao painel |
| 11 | Painel, rascunho com itens faltando | faixa **Rascunho** com a checklist; cada item tem **Resolver** (cadastro, Serviços, Profissionais ou Jornadas); **nenhum** botão de publicar |
| 12 | Completar tudo (Beleza) | aparece **Publicar meu estabelecimento**; ao tocar, some a faixa e o estabelecimento entra na busca |
| 13 | Saúde completo | botão **Enviar para análise**; faixa vira **Em análise** (diz o que já pode e o que está bloqueado) e a clínica **não** aparece na busca |
| 14 | `admin@example.com` → menu da conta → **Administração** (`#/admin/estabelecimentos`) | lista "Em análise" com a Clínica; filtros de status e categoria funcionam |
| 15 | Abrir a clínica → **Reprovar** sem motivo | "Informe o motivo…"; com motivo, o dono vê a faixa **Reprovado** com o motivo e o e-mail "Seu cadastro precisa de ajustes" |
| 16 | Dono corrige e **Reenviar para análise**; Admin **Aprova** | clínica aparece na busca; o dono vê **Aprovado** uma vez ("Entendi" some para sempre) |
| 17 | Admin **Suspende** (motivo) e **Reativa** | some e volta da busca; o dono vê **Suspenso** com o motivo |
| 18 | Conta que **não** é Admin abre `#/admin/estabelecimentos` | volta para a Home; e `GET /api/admin/businesses` com o token dela responde **403** |
| 19 | Página pública de um estabelecimento ativo (sem login): **Denunciar este estabelecimento** → motivo com menos de 5 caracteres | erro no campo; com motivo válido, "Recebemos a sua denúncia…". Abrir o mesmo formulário 6 vezes seguidas do mesmo IP: a 6ª mostra o erro de limite (429) |
| 20 | Admin → aba **Denúncias** (depois de `POST .../reports` pelo curl) | denúncia aberta (anônima ou "conta identificada"); **Resolver denúncia** a move para "Resolvidas" |

### Convite de equipe, backend (Fase 4, bloco 1 — migration `AddBusinessInvitation`)

Escrito sem Docker. Pilha isolada (seção 0), seed rodado. Conta do dono: `dono.duartina@example.com`.

| # | Passo | Esperado |
|---|---|---|
| 1 | A migration sobe com a pilha. No `psql`: `SELECT column_name FROM information_schema.columns WHERE table_schema='tenancy' AND table_name='business_invitation' ORDER BY ordinal_position;` | id, business_id, email, invitee_name, role, professional_id, invited_by_user_id, token_hash, expires_at, last_sent_at, accepted_at, accepted_user_id, revoked_at, terms_version, terms_accepted_at, created_at, updated_at |
| 2 | `SELECT DISTINCT seat_limit FROM tenancy.business;` | só `15` (o 1 antigo virou 15) |
| 3 | `dotnet test Booking.slnx --filter FullyQualifiedName~InvitationTests` (I1 a I5, escritos sem Docker) | verdes. Se I1 falhar, olhar primeiro o link do e-mail (`#/convite?token=`) |
| 4 | Como dono: `POST /api/businesses/current/invitations` `{ "name":"Teste", "email":"teste@example.com", "role":"Attendant" }` | 201 com `state: "Pending"`; no Mailpit (`http://localhost:8095`) chega o e-mail "Convite para a equipe de …" com o botão "Ver o convite" |
| 5 | `SELECT token_hash FROM tenancy.business_invitation;` | só o hash (64 caracteres hexadecimais); o token do link **não** aparece na tabela |
| 6 | `GET /api/businesses/current/seats` | `used` conta o dono + o convite pendente; `limit: 15` |
| 7 | Repetir o passo 4 com o mesmo e-mail | 409 `invitation.already_pending` |
| 8 | `POST /api/invitations/preview` `{ "token":"<do e-mail>" }`, sem token de login | 200 com `businessName`, `email`, `role`, `accountExists: false` |
| 9 | `POST /api/invitations/accept-new-account` com o token, nome e senha de 8+ caracteres | 200 `{ businessId, businessName, role: "Attendant" }`. `SELECT email_confirmed_at FROM identity."user" WHERE email='teste@example.com';` não é nulo |
| 10 | Repetir o passo 9 com o mesmo token | 409 `invitation.already_used` |
| 11 | Convidar de novo, **reenviar** (`POST …/{id}/resend`) e abrir o link do **primeiro** e-mail | 404 `invitation.not_found` (o link velho morreu); o do segundo e-mail funciona |
| 12 | Convidar e **revogar** (`DELETE …/{id}`); abrir o link | 410 `invitation.revoked` |
| 13 | Entrar com a conta do atendente criado e `GET /api/businesses/current/invitations` | 403 (só o dono) |
| 14 | Dono de **outro** estabelecimento: `DELETE …/invitations/{id}` de um convite deste | 404 |
| 15 | Convite de `Professional`, aceitar **sem** `acceptTerms` | 400 `invitation.terms_required`; nada é criado. Com `acceptTerms: true` o `SELECT terms_version, terms_accepted_at FROM tenancy.business_invitation;` mostra a versão `profissional-2026-11-rascunho` e a data |
| 16 | Aceitar logado com uma conta de **outro** e-mail (`POST /api/invitations/accept`) | 403 `invitation.email_mismatch` |
| 17 | Enviar 31 convites em uma hora, ou abrir a prévia 21 vezes do mesmo IP | 429 |

### Papel Atendente (Fase 4, bloco 2) — sem migration

Escrito sem Docker. O papel é texto (`role`), então não há migration. Pilha isolada (seção 0).

| # | Passo | Esperado |
|---|---|---|
| 1 | `dotnet test Booking.slnx --filter FullyQualifiedName~AttendantTests` (T1 a T4, escritos sem Docker) | verdes. T1 é a matriz de 28 rotas com 403; se uma falhar, a mensagem diz qual rota respondeu outra coisa |
| 2 | `dotnet test Booking.slnx --filter FullyQualifiedName~RolePolicyTests` (já rodou sem Docker: 68 casos) | verdes |
| 3 | Convidar um atendente (passo 4 do convite), aceitar, entrar e trocar de contexto | `POST /api/users/me/context` devolve `role: "Attendant"` |
| 4 | Com esse token: `GET /api/businesses/current/appointments?date=…` e `…/pending` | 200, com os pedidos de **todos** os profissionais |
| 5 | Confirmar um pedido do profissional A e outro do B | os dois 200, `status: Confirmed` |
| 6 | `POST …/appointments/counter` para o profissional B | 201 |
| 7 | `POST …/schedule-exceptions` (bloqueio de um período do profissional A) | 201 |
| 8 | `POST …/work-schedules`, `POST …/services`, `PUT …/address`, `POST …/invitations`, `DELETE …/professionals/{id}/photo` | **todos 403** |
| 9 | `GET /api/businesses/current` | **403** (só o dono) |
| 10 | `POST /api/appointments` com esse token | 403 `appointment.customer_context_required` |
| 11 | No `psql`: `SELECT actor_role, count(*) FROM scheduling.appointment_event GROUP BY 1;` depois do passo 5 | aparece `Attendant` (a coluna aceita até 20 caracteres) |

### Convite e painel por papel, frontend e seed (Fase 4, bloco 1 e 2)

Pilha isolada (seção 0), seed rodado. O seed agora cria `profissional.duartina@example.com` (ligado ao perfil Marcos Lima),
`atendente.duartina@example.com` e um convite pendente para `convidado.duartina@example.com` (o e-mail está no Mailpit).
**Tudo abaixo é visual ou depende do banco: nada foi visto.** Para cada tela: 390 px e desktop, claro e escuro, alvos ≥ 44 px.

| # | Passo | Esperado |
|---|---|---|
| 1 | `bun scripts/seed-demo.ts` duas vezes | a 2ª não duplica nada ("já existia — pulando"); o resumo lista profissional, atendente e convite |
| 2 | Mailpit: abrir o e-mail "Convite para a equipe de Estúdio Duartina" e o botão **Ver o convite** | abre `#/convite?token=…` |
| 3 | `#/convite` com o token do passo 2 (sem sessão) | mostra o estabelecimento, quem convidou e o e-mail; formulário de **conta nova** (nome, senha, confirmação); **sem** checkbox de termo (é atendente); botão "Já tenho conta: Entrar" |
| 4 | Senha com 7 caracteres → **Criar conta e aceitar** | erro "A senha tem no mínimo 8 caracteres" no campo; nada é criado |
| 5 | Preencher certo → **Criar conta e aceitar** | notificação "Convite aceito…" e abre `#/panel` já como atendente: menu **sem** Serviços, Profissionais, Jornadas, Fotos e Configurações |
| 6 | Atendente: Agenda | mostra o **filtro por profissional** e os pedidos de **todos**; confirmar um pedido funciona |
| 7 | Abrir o mesmo link de novo | tela "Convite indisponível: já foi usado" com o botão **Entrar** |
| 8 | Convite novo (dono: `POST /api/businesses/current/invitations`, role `Professional`) → abrir o link **sem** marcar o termo | erro "Aceite o termo do profissional para continuar."; marcado, conclui |
| 9 | Abrir o link logado com **outra** conta | "Você está com a conta X, mas este convite é para Y" e **Sair e entrar com outra conta**; ao tocar, vai a Entrar e volta ao convite |
| 10 | Convite para um e-mail que **já tem conta** (ex.: `profissional.duartina@example.com` já aceito → convidar `dono.helena@example.com` como atendente) | sem sessão: "Já existe uma conta com este e-mail" + **Já tenho conta: Entrar**; depois de entrar, volta ao convite e mostra **Aceitar convite** |
| 11 | Link adulterado (token cortado) e link vencido (alterar `expires_at` no banco) | "não existe ou o link está incompleto" e "expirou", respectivamente |
| 12 | Tela Entrar | mostra "Recebeu um convite? Use o link do e-mail." |
| 13 | `profissional.duartina@example.com` entra | painel **limitado**: agenda só com os pedidos dele; menu sem as seções do dono |
| 14 | Como esse profissional: `GET /api/businesses/current/professionals/me` e `PUT …/me` `{ "specialty":"x", "bio":"y" }` | 200; o nome não muda. Para o dono ou o atendente: 403 / 403 |
| 15 | Como esse profissional: `POST …/schedule-exceptions` com o `professionalId` **dele**; depois com o de outro profissional e sem `professionalId` | 201; depois **403** nos dois |

As telas de folgas/bloqueios (atendente e profissional) e de Meu perfil foram feitas depois: ver "Telas da equipe" abaixo.

### Perfil público sempre ligado e declaração do dono (Fase 4, bloco 3 — migration `ReplaceProfessionalConsentWithDeclaration`)

> ⚠️ A migration **publica de uma vez** o perfil de todo profissional ativo (descarta o consentimento antigo). Revise antes
> de aplicar em base com dado real. Rodar em pilha isolada.

| # | Passo | Esperado |
|---|---|---|
| 1 | A migration sobe com a pilha. `SELECT column_name FROM information_schema.columns WHERE table_schema='people' AND table_name='professional' ORDER BY ordinal_position;` | **sem** `is_publicly_visible` e `public_profile_consent_at`; **com** `authorization_declared_at`, `authorization_declared_by_user_id`, `authorization_declaration_version`, `registration` |
| 2 | `dotnet test Booking.slnx --filter "FullyQualifiedName~ProfessionalVisibilityTests\|FullyQualifiedName~ImageTests"` (R1 a R5 e P8, reescritos) | verdes |
| 3 | `bun scripts/seed-demo.ts` (banco novo) | termina sem erro; os profissionais criados pelo seed aparecem **com** bio na vitrine |
| 4 | Vitrine de um estabelecimento (sem login): lista de profissionais | todos os ativos com especialidade e bio; foto quando houver; **nenhum** só com o nome |
| 5 | Painel (dono) → Profissionais → **Novo profissional** (sem bio) → **Editar** → escrever uma apresentação e **não** marcar a declaração → Salvar | erro "Marque a declaração para salvar a apresentação." no formulário; nada é salvo |
| 6 | Marcar "Declaro ter autorização desta pessoa para exibir estes dados publicamente." → Salvar | salva; a ficha mostra "Declaração do dono registrada…". `SELECT authorization_declared_at, authorization_declared_by_user_id, authorization_declaration_version FROM people.professional WHERE display_name='…';` mostra a data, o dono e `declaracao-dono-2026-11-rascunho` |
| 7 | Editar a apresentação de novo | **não** pede a declaração outra vez |
| 8 | Profissional **com** login (`profissional.duartina@example.com`) no Editar do dono | **não** aparece o checkbox; a ficha diz "Os dados públicos são do próprio profissional" |
| 9 | Fotos → enviar a foto de um profissional **sem** login e **sem** declaração | recusa com "Marque a declaração de que você tem a autorização…" |
| 10 | Desativar um profissional que tem bio antiga e nunca declarou | desativa sem pedir declaração e sai da vitrine na hora |
| 11 | `PUT /api/businesses/current/professionals/{id}/public-profile-consent` | 404 (a rota não existe mais) |
| 12 | Visual 390 px, claro e escuro, do formulário Editar (checkbox com 44 px de alvo) e da ficha | sem rolagem horizontal; checkbox e texto legíveis nos dois temas |

### Telas da equipe: convidar, folgas e bloqueios, meu perfil e registro (sem migration)

Escritas sem Docker e sem navegador. **Nada foi visto.** Para cada tela: 390 px e desktop, claro e escuro, alvos ≥ 44 px,
foco visível. Pilha isolada (seção 0), seed rodado. Contas: `dono.duartina@example.com`, `atendente.duartina@example.com`,
`profissional.duartina@example.com`, `dono.novo@example.com` (Saúde).

| # | Passo | Esperado |
|---|---|---|
| 1 | `dotnet test Booking.slnx --filter FullyQualifiedName~AttendantTests` (T5 e T6 novos) | verdes |
| 2 | Dono → Profissionais: seção **Convites** abaixo da equipe | mostra "N de 15 vagas ocupadas" e "Nenhum convite pendente" (ou o do seed) |
| 3 | **Convidar** com nome vazio e e-mail inválido | erros nos campos; nada é enviado |
| 4 | Convidar como **Atendente** | notificação "Convite enviado para …"; o item aparece em pendentes com "Atendente" e a validade; o e-mail chega no Mailpit; o contador de vagas sobe 1 |
| 5 | Convidar como **Profissional** | aparece o seletor "Perfil de profissional" (criar novo ou ligar a um perfil sem conta); como Atendente ele some |
| 6 | Convidar o mesmo e-mail de novo | mensagem "Já existe um convite pendente para este e-mail." |
| 7 | **Reenviar** | "Convite reenviado."; chega novo e-mail; o link do e-mail anterior passa a dar "não existe" |
| 8 | **Revogar** → confirmar | "Convite revogado."; sai da lista; vaga volta; o link dá "foi cancelado" |
| 9 | Com 15 vagas ocupadas (reduzir `seat_limit` no banco para testar, ex.: `UPDATE tenancy.business SET seat_limit = 2 WHERE …`) | **Convidar** fica desligado e aparece "A equipe está completa" |
| 10 | Atendente entra → menu | **Folgas e bloqueios** presente; **sem** Serviços, Profissionais, Jornadas, Fotos, Configurações e Meu perfil |
| 11 | Atendente → Folgas e bloqueios | seletor de profissional + formulário **com** "Estabelecimento inteiro" + lista "Próximos bloqueios" |
| 12 | Atendente cria um bloqueio de um profissional com pedidos dentro | prévia dos afetados; escolher manter ou cancelar; salvo e listado; remover pede confirmação |
| 13 | Profissional entra → menu | **Folgas e bloqueios** e **Meu perfil** presentes; sem as seções do dono |
| 14 | Profissional → Folgas e bloqueios | **sem** seletor e **sem** "Estabelecimento inteiro"; só os bloqueios dele aparecem na lista |
| 15 | Profissional → Meu perfil | nome fixo, especialidade e apresentação editáveis; **Salvar** → "Perfil atualizado."; a vitrine mostra o novo texto |
| 16 | Profissional → Meu perfil → foto: enviar, trocar, remover | a foto aparece na vitrine; remover pede confirmação |
| 17 | Em Saúde (`dono.novo@example.com` depois de aprovado, ou outra clínica) | **Registro profissional (opcional)** aparece em Profissionais → Editar e em Meu perfil; em Beleza **não** aparece |
| 18 | Digitar `a`×41 no registro | o campo trava em 40 caracteres |
| 19 | Dono digita no endereço `#/panel/blocks` ou `#/panel/profile` | volta para a agenda (guard); atendente em `#/panel/profile` também volta |
| 20 | Celular: "Mais" | profissional vê Folgas, Meu perfil, Conta e Tema; atendente vê Folgas, Conta e Tema |

### Foto de serviço (Fase 4, bloco 5 — migration `AddServiceImage`)

| # | Passo | Esperado |
|---|---|---|
| 1 | A migration sobe com a pilha. `SELECT column_name FROM information_schema.columns WHERE table_schema='catalog' AND table_name='service';` | inclui `image_key` (NULL nas linhas antigas) |
| 2 | `dotnet test Booking.slnx --filter "FullyQualifiedName~ImageTests"` (P12 novo; os demais seguem) | verdes |
| 3 | Dono → Serviços → **Novo serviço** | o cartão Foto diz "Salve o serviço primeiro" |
| 4 | Dono → Serviços → Editar um serviço → **Foto**: enviar um JPEG | progresso, miniatura; `ls` na pasta de mídia mostra `businesses/<id>/services/<guid>-{s,m,l}.webp` |
| 5 | Enviar um `.exe` renomeado para `.jpg`; enviar imagem de 6 MB | recusados com a mensagem do 19b (tipo / tamanho) |
| 6 | Trocar a foto | os três arquivos antigos somem do disco |
| 7 | Página pública do estabelecimento (sem login) | o serviço mostra a foto ao lado do nome; os sem foto mostram o ícone da categoria |
| 8 | Remover (com confirmação) | volta o ícone; os arquivos somem |
| 9 | Em **Saúde** (Editar serviço) | aparece "não envie imagem de pacientes" |
| 10 | Profissional e atendente: `PUT …/services/{id}/image` | 403; dono de outro estabelecimento: 404 |
| 11 | 390 px, claro e escuro: cartão da foto e o serviço na vitrine | sem rolagem horizontal; alvo de toque ≥ 44 px; miniatura 48 px não estoura a linha |

### Página do profissional, remoção de perfil e sair do estabelecimento (migration `AddProfessionalRemovalRequest`)

| # | Passo | Esperado |
|---|---|---|
| 1 | A migration sobe com a pilha. `SELECT column_name FROM information_schema.columns WHERE table_schema='people' AND table_name='professional_removal_request';` | id, business_id, professional_id, reason, contact, requested_at, status, resolved_by_user_id, resolved_at, resolution, created_at, updated_at |
| 2 | `dotnet test Booking.slnx --filter FullyQualifiedName~ProfessionalPublicPageTests` (Q1 a Q5, escritos sem Docker) | verdes |
| 3 | Página do estabelecimento (sem login) → aba **Profissionais** | lista os ativos com foto ou iniciais, especialidade e **Ver perfil** (não diz mais "Em breve") |
| 4 | **Ver perfil** | abre `#/profissional/<id>`: nome, especialidade, sobre, **Agendar com NOME**, serviços (preço e duração dele), horários de **hoje e amanhã**, estabelecimento com endereço e link |
| 5 | **Agendar com NOME** e o **Agendar** de um serviço | abre a escolha de horário já com **aquele profissional** selecionado |
| 6 | Em Saúde, com registro informado em Meu perfil | aparece "Registro profissional: …" discreto; sem registro, não aparece |
| 7 | Desativar o profissional (Profissionais → Remover da equipe) e recarregar a página dele | tela de "não encontrado" (404); o mesmo para estabelecimento em rascunho |
| 8 | **Solicitar remoção deste perfil** com motivo de 4 caracteres | erro no campo; nada é enviado |
| 9 | Com motivo válido e contato | "Recebemos o seu pedido…"; chega e-mail ao dono no Mailpit (em Saúde, assunto genérico); o perfil **continua** na vitrine |
| 10 | Repetir o pedido 6 vezes do mesmo IP | a 6ª dá erro de limite (429) |
| 11 | Admin → `#/admin/estabelecimentos` → aba **Remoções de perfil** | o pedido aberto com profissional, estabelecimento, motivo e contato; **Resolver pedido** o move para "Resolvidos" |
| 12 | Conta que não é Admin em `GET /api/admin/professional-removals` | 403 |
| 13 | `profissional.duartina@example.com` → Meu perfil → **Sair do estabelecimento** → confirmar | volta ao contexto de consumidor; a página dele dá 404; `SELECT status FROM tenancy.business_membership WHERE …` mostra `Removed`; o histórico de agendamentos dele continua no banco |
| 14 | Atendente (celular) → Mais → **Sair do estabelecimento** | idem, sem perfil a desativar |
| 15 | Dono: `POST /api/businesses/current/leave` | 409 `business_membership.cannot_remove_owner` |
| 16 | 390 px, claro e escuro: página do profissional, aba Profissionais, formulário de remoção, aba do Admin | sem rolagem horizontal; alvos ≥ 44 px |

### Avaliações — backend (Fase 8, fatia 1; migration `AddReputation`)

| # | Passo | Esperado |
|---|---|---|
| 1 | A migration sobe com a pilha. `SELECT table_name FROM information_schema.tables WHERE table_schema='reputation';` | `review` e `rating_summary`; **sem** coluna `xmin` criada à mão em `rating_summary` (`xmin` é do sistema) |
| 2 | `dotnet test Booking.slnx --filter FullyQualifiedName~Reputation` | verdes (testes unitários, rodaram sem Docker). **Não há teste de integração nesta fatia**: a trava `ux_review_appointment`, o `xmin` e o 503 de disputa só se provam com o banco, pelos passos 4 e 12 abaixo |
| 3 | Concluir um agendamento e `POST /api/appointments/{id}/review` `{ "rating": 5, "professionalRating": 4 }` com a conta do consumidor | 201; `rating_summary` ganha 1 linha do estabelecimento e 1 do profissional (`count = 1`) |
| 4 | Repetir o POST | 409 `review.already_reviewed` |
| 5 | POST com token de painel (dono) | 403 `appointment.customer_context_required` |
| 6 | POST de um agendamento ainda **não concluído** | 409 `review.not_completed` |
| 7 | POST de agendamento de **outro** consumidor | 404 `review.not_found` |
| 8 | `PUT` com nota diferente; depois um segundo `PUT` | o 1º muda a média (confira `sum`/`count`: não soma duas vezes); o 2º dá 409 `review.already_edited` |
| 9 | `GET /api/businesses/{id}/rating` com 1 e 2 avaliações; depois com 3 | até 2: `average` nulo e `isNew` verdadeiro; com 3: média com 1 casa |
| 10 | Avaliação em estabelecimento de **Saúde** | `serviceName` nulo na resposta e `service_name` nulo no banco |
| 11 | `GET /api/businesses/{id}/reviews` | só "Nome S."; sem id de consumidor |
| 12 | Duas avaliações de agendamentos diferentes do mesmo estabelecimento **ao mesmo tempo** (dois `curl` em paralelo) | as duas gravam, ou uma dá 503 `review.contention_try_again`; **a contagem nunca perde uma** |
| 13 | 11 POSTs na mesma hora com a mesma conta | o 11º dá 429 |

### Avaliações — busca por nota (Fase 8, fatia 2; sem migration)

| # | Passo | Esperado |
|---|---|---|
| 1 | `dotnet test --filter FullyQualifiedName~SearchBusinessesQueryTests` | verdes (testes unitários, rodaram sem Docker) |
| 2 | Com 3 ou mais avaliações em dois estabelecimentos: `GET /api/businesses/search?latitude=…&longitude=…&sortBy=rating` | o de maior média primeiro; os sem média no fim, na ordem de distância |
| 3 | `…&minRating=4` | só médias ≥ 4; os "Novos" não aparecem; `totalCount` confere |
| 4 | `…&minRating=0` e `…&minRating=6` | 400 `search.min_rating_invalid` |
| 5 | Busca sem `sortBy` | cada item traz `ratingAverage` (nulo se "Novo") e `ratingCount` |
| 6 | Os **30 estabelecimentos do seed** continuam aparecendo na busca como antes (nenhum some por falta de nota) | sim |

### Integração com a agenda (Fase 5, bloco 4, parcial)

| # | Passo | Esperado |
|---|---|---|
| 1 | `dotnet test` — `EmailTests.M6` (caso `cancel`, ajustado) | o e-mail de cancelamento leva `cancelamento.ics` com `METHOD:CANCEL`, `STATUS:CANCELLED`, mesmo `UID` e `SEQUENCE:1` |
| 2 | "Meus agendamentos" → agendamento confirmado → **Adicionar à agenda** | menu com Google Agenda, Outlook e "Apple e outros (arquivo .ics)" |
| 3 | Google Agenda | abre `calendar.google.com` com título, data e hora **no horário certo** (conferir o fuso), local e o link do mapa |
| 4 | Outlook | abre `outlook.live.com` com os mesmos dados |
| 5 | Apple e outros | baixa o `.ics`; abrir no celular/Calendário: evento com lembrete 1 h antes, endereço e mapa; baixar de novo **não duplica** |
| 6 | Receber o e-mail de cancelamento e abrir o `.ics` na agenda | o evento salvo antes **some** |
| 7 | Menu em 390 px, claro e escuro | alvo de toque ≥ 44 px, abre para cima sem sair da tela |

### Fechamento da casca mobile (#34)

| # | Passo | Esperado |
|---|---|---|
| 1 | Auditoria 390 px, claro e escuro, de: home, busca, estabelecimento, agendar, revisão, pedido enviado, meus agendamentos, minha conta, entrar, criar conta, recuperar senha | sem rolagem horizontal, sem rótulo cortado, alvos ≥ 44 px. **Anote antes/depois dos defeitos achados.** |
| 2 | Tela de escolha de contexto (`#/context`) e telas de recuperar/redefinir senha | conferir se faltam o alternar tema (hoje só entrar, criar conta, conta e Mais têm) |
