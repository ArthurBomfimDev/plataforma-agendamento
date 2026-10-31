# plataforma-agendamento

> **Marca: Vagoo** — definida em 09/10 ([`docs/design/marca-vagoo.md`](docs/design/marca-vagoo.md)).
> O repositório (`plataforma-agendamento`) e o namespace `Booking.*` **continuam neutros** até a
> decisão da pendência K do [`PROJECT-CONTEXT.md`](PROJECT-CONTEXT.md). Se for para renomear, o GitHub
> mantém o redirecionamento.

Marketplace SaaS de descoberta e agendamento de serviços. Dois lados: o consumidor que busca e
agenda, o estabelecimento que gerencia agenda, catálogo e equipe. Verticais do MVP: beleza e
bem-estar, mais saúde restrita a agendamento — **sem prontuário, exame, laudo ou anexo clínico**.

Trabalho de Conclusão de Curso — **FATEC Garça**, Tecnologia em Análise e Desenvolvimento de
Sistemas, 2026. Orientadora: Prof.ª Dr.ª Cláudia Maria Bernava Aguillar.

| | |
|---|---|
| **Arthur Bomfim** ([@ArthurBomfimDev](https://github.com/ArthurBomfimDev)) | Backend, arquitetura, banco, infraestrutura |
| **Rafael Ernandes** ([@RafaelErnandes](https://github.com/RafaelErnandes)) | Frontend, design system |

## Stack

React + TypeScript + **Vite** (Bun como gerenciador de pacotes) · C# / ASP.NET Core (**.NET 10**) ·
**PostgreSQL + PostGIS + `btree_gist`** · monólito modular em monorepo · PWA primeiro.

O detalhe e a justificativa de cada escolha estão nas [ADRs](docs/decisions/).

## Por onde começar

| Você quer | Leia |
|---|---|
| Ter a visão integral do projeto | [`docs/DOCUMENTO-GERAL.md`](docs/DOCUMENTO-GERAL.md) |
| Entender o estado do projeto | [`PROJECT-CONTEXT.md`](PROJECT-CONTEXT.md) |
| Contribuir com código | [`CLAUDE.md`](CLAUDE.md) — glossário, convenções, regras invioláveis |
| Entender uma decisão técnica | [`docs/decisions/`](docs/decisions/) |
| Ver o modelo de domínio | [`docs/produto/modelo-de-dominio.md`](docs/produto/modelo-de-dominio.md) |
| Trabalhar no design | [`docs/design/`](docs/design/) e [`frontend/src/styles/`](frontend/src/styles/) |

## Configuração do clone

```bash
git config core.hooksPath .githooks
```

**Isto não é opcional.** O repositório versiona um hook `commit-msg` que remove trailers de
atribuição de IA (`Co-Authored-By: Claude ...` e equivalentes) das mensagens de commit. Sem o
comando acima o Git ignora a pasta `.githooks/` e o hook não roda.

O motivo está no cabeçalho do próprio hook: o GitHub transforma esse trailer em *Contributor*
do repositório. Este é um TCC — a autoria precisa ser inequívoca. A ferramenta usada para
produzir o trabalho se cita na metodologia, não na lista de contribuidores. Coautoria humana
legítima é preservada pelo hook.

## Governança do repositório

A branch `main` é protegida: pull request obrigatório, uma aprovação de code owner, conversas
resolvidas, sem force push e sem deleção. Quatro checks obrigatórios:

| Check | O que garante |
|---|---|
| `backend / build-test` | Build, testes e a prova da constraint de exclusão da ADR-005 |
| `backend / format` | `dotnet format --verify-no-changes` |
| `frontend / build-lint` | Lint, tipos, formatação, testes e build |
| `governance / no-ai-coauthor` | Nenhum commit do PR tem trailer de atribuição de IA |

### Por que os workflows não têm filtro de caminho

Check obrigatório com filtro de caminho no gatilho não roda em PR que não toca a área — e check
que não roda nunca fica verde. Todo PR só de documentação ficaria **bloqueado para sempre**.

Os workflows rodam sempre; um job `changes` decide se há o que verificar. Quando não há, os jobs
pesados são pulados, e o GitHub trata job pulado por condição como sucesso no check obrigatório.
Assim PR de documentação passa em segundos e PR de código roda a verificação completa, com o
mesmo nome de check nos dois casos.

### Por que todo caminho do CODEOWNERS tem os dois

O GitHub nunca aceita aprovação do autor do próprio PR. Um caminho com um único code owner
deixaria todo PR desse owner naquele caminho **sem ninguém que pudesse aprovar**. Numa equipe
de duas pessoas, "code owner que não é o autor" é sempre a outra pessoa — então os dois aparecem
em tudo, com o responsável principal primeiro na linha.

### Por que existe o check `governance / no-ai-coauthor`

O hook local só funciona em quem rodou `git config core.hooksPath .githooks`. Um commit com
`Co-Authored-By: Claude` que escape faz o GitHub listar a IA como Contributor — e isso **não sai
reescrevendo o histórico**: o GitHub guarda os commits antigos e a contagem em cache. Este
repositório já foi apagado e recriado uma vez por esse motivo. O check no CI é a proteção que não
depende da configuração de ninguém.

### Por que `enforce_admins` está desligado

Deliberadamente, e vale registrar o motivo para que a decisão não seja lida como desleixo.

A equipe tem **duas pessoas**. Com `enforce_admins: true`, a exigência de uma aprovação mais
CODEOWNERS cria dependência mútua total: nenhum dos dois consegue integrar nada sem o outro.
Numa equipe de dez isso é saudável; numa de dois, qualquer imprevisto — viagem, doença, prova,
uma semana sem conexão — trava o repositório inteiro num prazo de nove semanas.

`enforce_admins: false` mantém todas as regras valendo no fluxo normal e deixa uma saída de
emergência para o administrador. **A regra continua sendo o PR revisado.** O que separa válvula
de emergência de desleixo é estar escrita, ter motivo declarado e ser exceção — não hábito.

Uso da válvula deve ser registrado no PR ou na issue correspondente, com a razão.

## Comandos

```bash
# Backend (em backend/) — requer SDK .NET 10 e Docker rodando (testes de integração)
dotnet build Booking.slnx
dotnet test Booking.slnx          # arquitetura, unitários e integração
dotnet format Booking.slnx --verify-no-changes

# Frontend (em frontend/) — requer Bun 1.4.2 (winget install Oven-sh.Bun)
bun install
bun run lint && bun run typecheck && bun run format:check && bun run test && bun run build
bun run dev
```

O Bun é o gerenciador de pacotes e o executor de scripts; **o bundler é o Vite** (ADR-011).
A versão do Bun fica em `frontend/.bun-version` e é a mesma usada no CI.

O backend é organizado em camadas (`src/Core`, `src/Infrastructure`, `src/Presentation`), com os
módulos como pastas `Module/<Contexto>` dentro de cada camada. A fronteira entre módulos não é
garantida pelo compilador — é garantida por `Booking.ArchitectureTests`, que quebra o build.
Detalhes e motivo de cada regra: `CLAUDE.md` §5 e ADR-010.

`Booking.IntegrationTests` sobe a API real contra um PostgreSQL + PostGIS próprio: com
`ConnectionStrings__Default` definida (o CI define), cria um banco novo nesse servidor; sem ela, sobe
`postgis/postgis:17-3.5` por Testcontainers — por isso precisa do Docker. Nunca toca o banco de
desenvolvimento. Evidências das execuções em `docs/tcc/evidencias/`.

## Rodando o projeto com Docker

Sobe banco, migrations, API e frontend com um comando. Só precisa do Docker Desktop.

```bash
./scripts/setup-env.ps1        # Windows — no Linux/macOS: ./scripts/setup-env.sh
docker compose up --build
```

O `setup-env` cria o `.env` na raiz com senha do banco e chave JWT aleatórias. O `.env` não é
versionado e o compose recusa subir sem ele.

| Serviço | Endereço | O que é |
|---|---|---|
| `web` | http://localhost:8080 | Frontend (build do Vite servido pelo nginx) |
| `api` | http://localhost:8081 | API; OpenAPI em `/openapi/v1.json`, saúde em `/health` |
| `db` | `localhost:5433` | PostgreSQL 17 + PostGIS; usuário e senha no `.env` |
| `migrations` | — | Aplica as migrations do EF Core e termina; roda a cada `up` |

O banco é criado pelas migrations na primeira subida e fica no volume `booking_db-data`.
As imagens enviadas (logotipo, capa, foto do profissional) ficam no volume `booking_media-data`, servidas
pela API em `/media/…` (ADR-023). O banco guarda só o caminho de cada imagem.
Para recomeçar do zero: `docker compose down -v` (apaga os dois volumes).

### Backup

O disco do contêiner não guarda nada: o que importa está nos dois volumes, e **o backup precisa levar os
dois juntos** — um banco restaurado sem as imagens aponta para arquivos que não existem, e o contrário
deixa arquivos sem dono.

```bash
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > backup-banco.dump
```

```bash
docker run --rm -v booking_media-data:/media:ro -v "$PWD":/backup alpine tar czf /backup/backup-imagens.tar.gz -C /media .
```

Restaurar é o caminho inverso (`pg_restore` e `tar xzf` no volume), com a API parada.

### Dados de demonstração

Com o ambiente no ar, popule o banco com 30 estabelecimentos fictícios em Garça-SP (onde é feita a
demonstração do TCC) — 26 de Beleza e 4 de Saúde —, profissionais, serviços, jornadas, uma conta de
consumidor e um Admin da plataforma:

```bash
bun scripts/seed-demo.ts               # pela API, ~6 min (limite de 10 logins por minuto)
bun scripts/seed-demo.ts --historico   # o mesmo + 60 dias de histórico e agenda futura (só banco local)
```

O roteiro passa pela própria API, com as mesmas regras do app — inclusive a aprovação, feita pelo
Admin de demonstração em `api/admin/businesses`. Duas escritas são diretas no banco local: conceder o
papel de Admin (nunca concedido por endpoint, ADR-020) e, com `--historico`, o histórico, que não
passa pela API (antecedência mínima, horizonte). As contas de teste e a senha aparecem no fim da
execução e no topo de `scripts/seed-demo.ts`. Pode rodar de novo: conta, CNPJ e histórico que já
existem são pulados. Num banco de um seed anterior (contas em `exemplo.com`), recomece do zero com
`docker compose down -v` para ter os 30.

**Para ver o painel do estabelecimento com dados, rode com `--historico`:** são 60 dias de passado
e 14 de agenda futura, com pedidos pendentes, para todos os estabelecimentos. O histórico é gravado
uma vez só, no dia em que roda. Sem `--historico`, os 3 primeiros estabelecimentos (Estúdio Duartina,
Espaço Helena Unhas, Barbearia do Rogério) ganham uma agenda pequena pela API: duas marcações de
balcão hoje e dois pedidos da consumidora de demonstração amanhã (pendentes, exceto no Espaço Helena,
que confirma sozinho). Rodar de novo num dia seguinte cria a agenda daquele dia.

Busca: os 30 estabelecimentos ficam em Garça-SP. Escolha "Garça, SP (demonstração)" no seletor de
localização da barra do topo; no mesmo seletor fica a distância, com "Cidade" como padrão (os 30) e
1, 2, 5, 10 e 20 km recortando por raio. Ela fica guardada com o endereço e na URL (`radius=`). O
termo aceita acento ou não e sinônimos: "cabelo", "cabêlo" e "corte" trazem os mesmos salões.

Painel: entre com `dono.duartina@example.com` (senha no fim da execução). Conta só de
estabelecimento abre direto nos pedidos (`#/panel/requests`). A gestão do estabelecimento fica no
menu lateral (no celular, em "Mais"): Serviços, Profissionais, Jornadas e bloqueios, Fotos e
Configurações, só para o dono. Para ver o aviso de saúde, entre com o dono de um estabelecimento de
Saúde, por exemplo `dono.clinica.de.fisioterapia.duarte@example.com`.

Conta dona **e** consumidora (o seed não cria): entre com a conta do dono e crie o perfil de
consumidor pela API, com o token do login (que vem em contexto de consumidor):

```bash
curl -X POST http://localhost:8081/api/customers/me -H "Authorization: Bearer <accessToken do login>" -H "Content-Type: application/json" -d "{\"birthDate\":\"1985-03-20\",\"socialName\":null}"
```

Depois disso o menu da conta oferece "Consumidor" e "Painel: Estúdio Duartina". O dono não agenda
no próprio estabelecimento (409): para ele, é a marcação de balcão.

Testes de carga (k6) dos RNF-01 e RNF-02: `scripts/perf/`, com o passo a passo em
`docs/tcc/evidencias/rnf-01-busca.md`.

Sem provedor de e-mail, o token de confirmação e o de redefinição de senha aparecem só no log
da API (`docker compose logs api`). A URL da API é embutida no frontend no build: mudou
`API_PORT`, rode `docker compose up --build` de novo.

As portas escutam só em `127.0.0.1`. A imagem do PostGIS é só amd64: em Mac com chip Apple ela
roda emulada, mais devagar.

## Licença

Ainda não definida. Enquanto isso, todos os direitos reservados aos autores.
