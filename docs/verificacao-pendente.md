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
