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

A branch `main` é protegida: pull request obrigatório, uma aprovação, CODEOWNERS, conversas
resolvidas, sem force push e sem deleção. Os três checks obrigatórios são
`backend / build-test`, `backend / format` e `frontend / build-lint`.

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
# Backend
dotnet restore && dotnet build && dotnet test
dotnet format --verify-no-changes

# Frontend (em src/web)
npm ci && npm run lint && npm run typecheck && npm run build
```

## Licença

Ainda não definida. Enquanto isso, todos os direitos reservados aos autores.
