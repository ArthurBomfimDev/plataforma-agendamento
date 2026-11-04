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

### Fechamento da casca mobile (este PR)

| # | Passo | Esperado |
|---|---|---|
| 1 | Auditoria 390 px, claro e escuro, de: home, busca, estabelecimento, agendar, revisão, pedido enviado, meus agendamentos, minha conta, entrar, criar conta, recuperar senha | sem rolagem horizontal, sem rótulo cortado, alvos ≥ 44 px. **Anote antes/depois dos defeitos achados.** |
| 2 | Tela de escolha de contexto (`#/context`) e telas de recuperar/redefinir senha | conferir se faltam o alternar tema (hoje só entrar, criar conta, conta e Mais têm) |
