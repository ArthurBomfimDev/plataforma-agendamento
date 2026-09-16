# plataforma-agendamento

> ⚠️ **Nome provisório.** A marca ainda não existe. O repositório será renomeado quando o nome
> for definido — o GitHub mantém o redirecionamento. O namespace `Booking.*` do backend segue
> a mesma regra.

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

React + TypeScript + **Vite** · C# / ASP.NET Core (**.NET 10**) · **PostgreSQL + PostGIS** ·
monólito modular em monorepo · PWA primeiro.

O detalhe e a justificativa de cada escolha estão nas [ADRs](docs/decisions/).

## Por onde começar

| Você quer | Leia |
|---|---|
| Entender o estado do projeto | [`PROJECT-CONTEXT.md`](PROJECT-CONTEXT.md) |
| Contribuir com código | [`CLAUDE.md`](CLAUDE.md) — glossário, convenções, regras invioláveis |
| Entender uma decisão técnica | [`docs/decisions/`](docs/decisions/) |
| Ver o modelo de domínio | [`docs/produto/modelo-de-dominio.md`](docs/produto/modelo-de-dominio.md) |
| Trabalhar no design | [`docs/design/`](docs/design/) e [`src/web/src/styles/`](src/web/src/styles/) |

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
# Backend (em backend/) — requer SDK .NET 10
dotnet build Booking.slnx
dotnet test Booking.slnx          # inclui os testes de arquitetura
dotnet format Booking.slnx --verify-no-changes

# Frontend (em frontend/)
npm ci && npm run lint && npm run typecheck && npm run build
```

O backend é organizado em camadas (`src/Core`, `src/Infrastructure`, `src/Presentation`), com os
8 módulos como pastas `Module/<Contexto>` dentro de cada camada. A fronteira entre módulos não é
garantida pelo compilador — é garantida por `Booking.ArchitectureTests`, que quebra o build.
Detalhes e motivo de cada regra: `CLAUDE.md` §5 e ADR-010.

## Licença

Ainda não definida. Enquanto isso, todos os direitos reservados aos autores.
