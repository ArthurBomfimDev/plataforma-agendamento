# Integração do trabalho do Rafael (10/11/2026)

Branch de integração: `feat/integracao-final`, criada da ponta do PR #58 (`fix/correcoes-teste-0511`, `ce03b28`).
Backup antes de qualquer mescla: `backup-final-2026-11-10.bundle`, fora do repositório, verificado com `git bundle verify`.

## 1. Inventário

Critério: `git branch -r --no-merged feat/integracao-final`, filtrado pelos commits de Rafael (`RafaelErnandes`). O autor tem
49 commits no repositório; quase todos já estavam na base por mesclas anteriores. Sobraram duas branches.

| Branch | Autor | Commits fora da base | Arquivos | Também alterados na branch do #58 |
|---|---|---|---|---|
| `origin/frontend` | RafaelErnandes | 1 (`e16d30f`, merge do PR #28) | **nenhum**: a árvore é idêntica à do merge-base | nenhum |
| `origin/refactor/login` | RafaelErnandes | 1 (`3c16b56`, 07/11) | 27 (18 novos) | 3 |

As outras branches remotas sem mescla (`chore/esqueleto-backend`, `chore/frontend-bun`, `claude/identity-backend-9951da`,
`docs/adrs-iniciais`, `docs/contexto-10-09`, `fix/demo-publica-email`, `fix/smtp-crl`) são do Arthur e foram deixadas de fora.
Não há branch local só com commits do Rafael.

### `origin/refactor/login`: o que traz

Novo layout da tela de entrada: palco de marca (`brand-stage`), `agenda-rail`, `inline-alert`, `AuthLayout` (painel do
formulário + palco), ajustes em `password-field`, `use-media-query`, `tokens.css`, `index.css`, `errors.ts` e
`api/services/auth/context.ts`. Acrescenta `jsdom` como dependência de teste e o apoio `utils/test-dom.tsx` para testes de
interação, em arquivos com `// @vitest-environment jsdom`.

Arquivos que ele e o #58 alteraram:

| Arquivo | O Rafael | O #58 |
|---|---|---|
| `frontend/src/api/base/errors.ts` | texto de `auth.invalid_credentials` | mensagem de `professional.cannot_create_without_invitation` |
| `frontend/src/layouts/auth-layout/index.tsx` | `AuthLayout` novo | `min-w` de 44 px em `AUTH_LINK_CLASSES` |
| `frontend/src/pages/auth/sign-in/screen/index.tsx` | usa `AuthLayout`, `InlineAlert`, `LINK_CLASSES` de `./consts` | `LINK_CLASSES` local com `min-w` de 44 px e `ThemeToggle` próprio |

## 2. Mesclas

Sempre com merge commit (`--no-ff`), sem squash e sem rebase. Nenhum push em branch do Rafael.

| # | Merge | Commit | Resultado |
|---|---|---|---|
| 1 | `origin/frontend` | `399ad6e` | sem conflito e sem mudança de conteúdo; só traz o histórico |
| 2 | `origin/refactor/login` | `b98bbfe` | 1 conflito, resolvido abaixo |

### Conflitos

| Arquivo | Tipo | Resolução | Regra aplicada |
|---|---|---|---|
| `pages/auth/sign-in/screen/index.tsx` | **conflito de conteúdo** nos imports | Ficou o lado do Rafael: o `LINK_CLASSES` local e o `ThemeToggle` saíram, porque o `AuthLayout` novo já tem o alternador e o `LINK_CLASSES` foi para `./consts`. | layout e componentes visuais seguem o Rafa |
| `pages/auth/sign-in/screen/consts.ts` | ajuste depois da mescla | O `LINK_CLASSES` do Rafael ganhou `min-w-(--size-touch-min)`: o link "Entrar" media 40 px de largura na auditoria de 05/11. | acessibilidade da auditoria preservada |
| `api/base/errors.ts` | mescla automática | Mantidos os dois lados: o texto novo do Rafael e a mensagem de convite do #58. | regra de negócio e mensagem de API seguem o #58; texto de interface segue o Rafa |
| `layouts/auth-layout/index.tsx` | mescla automática | Ficou o `AuthLayout` do Rafael e o `min-w` de `AUTH_LINK_CLASSES` do #58 (a constante continua exportada). `AuthShell`, usado por convite, confirmação e redefinição, segue com o próprio alternador de tema. | layout segue o Rafa |

Nada de autorização, convite, Atendente ou consentimento foi tocado pela branch do Rafael.

## 3. Verificação depois de cada mescla

| Depois do merge | typecheck | lint | format | testes do frontend | build |
|---|---|---|---|---|---|
| 1 (`399ad6e`) | não rodado: árvore idêntica | n/a | n/a | n/a | n/a |
| 2 (`b98bbfe`) | ok | ok (2 avisos antigos) | ok | **601 de 601, em 79 arquivos** | ok |

Na primeira execução dois arquivos de teste do Rafael (`sign-in/screen` e `brand-stage`) não iniciaram: "Cannot find package
'jsdom'". Eu tinha instalado as dependências antes da mescla, e a branch dele acrescenta o `jsdom`. Depois de `bun install
--frozen-lockfile`, os 79 arquivos rodaram. Nenhum teste foi alterado.

A contagem do frontend subiu de 580 (#58) para 601: os 21 testes novos são do Rafael.
