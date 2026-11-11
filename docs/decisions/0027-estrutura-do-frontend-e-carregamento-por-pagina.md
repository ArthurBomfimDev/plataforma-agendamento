# ADR-027 — Estrutura do frontend por responsabilidade e carregamento sob demanda por página

- **Status:** Proposto
- **Data:** 2026-10-30
- **Decisores:** Arthur Bomfim, Rafael Ernandes
- **Módulos afetados:** frontend (todo `src/`)
- **Substitui:** —
- **Substituído por:** —

---

## Contexto

**Fato.** Até 30/10, `src/router/` tinha 48 arquivos: a definição das rotas, mas também os containers de cada tela
(`*-route.tsx`), as molduras (`app-layout`, `panel-layout`), os guards, os adaptadores de API para tela e hooks. As
telas puras ficavam em `src/features/`, a store em `src/lib/zustand`, as imagens em `src/global/images`.

**Fato.** Havia código morto (duas cópias soltas de hooks e de células do calendário), produção importando de
arquivo de mock e nomes fora do padrão (`conts.ts`, `holyday-marker`, pastas em PascalCase).

**Fato.** O build gerava um único chunk de JavaScript de 1,1 MB (339 kB gzip): quem abria a vitrine baixava o
painel inteiro.

**Fato.** A separação entre container (busca os dados) e tela pura (recebe props) já existia e é ela que permite
testar as telas sem API — 44 arquivos de teste dependem disso.

## Problema

Como organizar `src/` para que cada responsabilidade tenha um lugar previsível e o consumidor não baixe o código
do painel?

## Alternativas consideradas

### A — Manter `features/` + containers em `router/`

**A favor:** nenhuma movimentação; histórico intacto.
**Contra:** `router/` continua misturando seis responsabilidades; nada indica onde mora a moldura ou o guard.

### B — Por domínio (`modules/<domínio>/{api,pages,components}`)

**A favor:** espelha os módulos do backend.
**Contra:** as telas não seguem os módulos — a agenda do painel junta Scheduling, Availability, People e Catalog;
partir a tela por domínio criaria dependência cruzada entre pastas o tempo todo.

### C — Por responsabilidade, com página = container + tela pura

**A favor:** `pages/` por contexto de uso (consumidor, conta, painel), `layouts/`, `router/` só com rotas, caminhos
e guards; preserva a separação container × tela que sustenta os testes.
**Contra:** 224 arquivos movidos de uma vez; quem tinha branch aberto sobre `features/` ou `router/` precisa
rebasear.

## Decisão

Organizamos `src/` assim:

- `api/` (ADR-025) · `assets/` (imagens e o registro de ícones do ADR-026) · `components/` (compartilhados e
  `ui/` do shadcn) · `hooks/` · `layouts/` (`public-layout`, `panel-layout`, `auth-layout`) · `store/` (Zustand) ·
  `styles/` · `utils/`.
- `pages/<contexto>/<página>/` com `index.tsx` (o container, exportado por nome), `screen/` (a tela pura e os
  testes dela) e `components/` quando a página tem peças internas. Contextos: `customer/`, `auth/`, `account/`,
  `panel/`, mais `not-found/`.
- `router/` só com `route.tsx`, `paths.ts`, `lazy-page.ts` e `guards/`.

Cada página e a moldura do painel são carregadas sob demanda (`React.lazy` via `lazyPage`), com `Suspense` dentro
das molduras — a barra superior e a navegação do painel não somem enquanto a página carrega. A moldura do consumidor
e a 404 ficam no chunk inicial.

**Medição (build de 30/10):** chunk inicial de 339 kB → 108 kB gzip.

## Consequências

### O que fica mais fácil

- Achar onde algo mora pelo papel que cumpre.
- Abrir a vitrine no celular: um terço do JavaScript de antes no primeiro acesso.

### O que fica mais difícil

- Navegar para uma página pela primeira vez baixa o chunk dela: em rede lenta aparece o "Carregando…" da moldura.
- Teste que renderiza rotas precisa esperar os chunks: `src/router/route.test.tsx` usa `prerender`
  (`react-dom/static`) em vez de `renderToString`.
- Os adaptadores compartilhados por várias páginas de um contexto ficam na raiz do contexto
  (`pages/customer/adapters.ts`, `pages/panel/adapters.ts`), e a moldura do painel importa de `pages/panel` — uma
  dependência de `layouts/` para `pages/` aceita conscientemente.

### O que passa a ser proibido

- Container de página em `router/`.
- Tela pura buscando dado: dado de servidor entra pelo container.
- Importar página de forma estática em `route.tsx`.

## Como saber que erramos

- Se o chunk inicial voltar a passar de 200 kB gzip, algo do painel ou de página vazou para a moldura do consumidor.
- Se o "Carregando…" entre páginas aparecer nos testes de usabilidade como incômodo, pré-carregar as páginas do
  fluxo de agendamento a partir da tela do estabelecimento.

## Referências

- ADR-009 — paridade mobile do painel (justifica olhar o peso do primeiro acesso no celular).
- ADR-025, ADR-026.
