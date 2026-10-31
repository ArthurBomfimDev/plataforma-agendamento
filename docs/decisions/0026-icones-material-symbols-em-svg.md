# ADR-026 — Ícones: Material Symbols em SVG, gerados no build, num registro único

- **Status:** Proposto
- **Data:** 2026-10-30
- **Decisores:** Arthur Bomfim, Rafael Ernandes
- **Módulos afetados:** frontend (`src/assets/icons`, todo componente com ícone)
- **Substitui:** —
- **Substituído por:** —

---

## Contexto

**Fato.** Até 30/10 os ícones vinham do `lucide-react`: 64 imports, 56 ícones distintos, inclusive dentro dos
componentes do shadcn (`src/components/ui`). O `components.json` do shadcn está configurado com
`"iconLibrary": "lucide"`.

**Fato.** A equipe decidiu, na refatoração de 30/10, padronizar em Material Symbols, em SVG.

**Fato.** O mesmo build roda no navegador, no Capacitor e no Tauri (regras de empacotamento). Ícone que depende de
rede — fonte de ícones de CDN, ou o `@iconify/react` buscando o SVG na API do Iconify — não aparece offline.

**Fato.** Quase todo uso dimensionava o ícone por classe (`size-5`); `strokeWidth` aparecia em 3 lugares.

## Problema

Como usar Material Symbols em SVG sem depender de rede, sem carregar o conjunto inteiro e sem espalhar a escolha
do ícone pelo código?

## Alternativas consideradas

### A — `@mui/icons-material`

**A favor:** componentes React prontos, oficiais do Material.
**Contra:** exige `@mui/material` e Emotion como dependências — um segundo sistema de estilo ao lado do Tailwind e
do shadcn; traz Material Icons, não Material Symbols.

### B — Fonte variável do Material Symbols

**A favor:** um arquivo, todos os ícones, eixos de peso e preenchimento.
**Contra:** não é SVG; a fonte inteira vai para o bundle (centenas de kB) ou vem de CDN (quebra offline); ícone
por ligadura some como texto enquanto a fonte carrega.

### C — `unplugin-icons` + `@iconify-json/material-symbols`, com registro em `src/assets/icons`

**A favor:** cada ícone vira um componente React com o SVG inline em tempo de build; só os importados entram no
bundle; nada é buscado em tempo de execução; os pacotes ficam em `devDependencies`.
**Contra:** um plugin a mais no Vite; o compilador React do plugin exige `@svgr/core` e `@svgr/plugin-jsx`; o JSON
do conjunto é grande no `node_modules` (só no build).

## Decisão

Usamos **Material Symbols, estilo Rounded**, via `unplugin-icons` (compilador `jsx`), com 24 px por atributo — como
o lucide fazia — para a classe `size-*` de quem usa continuar mandando.

Todo ícone passa pelo registro `src/assets/icons/index.ts`, com nome pelo significado (`CloseIcon`,
`ScheduleIcon`…) e o tipo `IconComponent` para props que recebem ícone. O `lucide-react` sai das dependências.

## Consequências

### O que fica mais fácil

- Trocar o estilo (Rounded → Outlined/Sharp) ou um ícone: uma linha no registro.
- Funcionar offline no shell nativo: o SVG está no JavaScript.

### O que fica mais difícil

- Os ícones do app somam cerca de 30 kB gzip num chunk compartilhado (51 ícones; medido no build de 30/10).
- `npx shadcn add` continua configurado para lucide (`components.json`; o shadcn não oferece Material): todo
  componente novo do shadcn chega importando `lucide-react` e precisa ser trocado pelo registro antes do merge.
- Material é preenchido, o lucide era traço: a espessura visual dos ícones mudou, e `strokeWidth` não tem efeito.

### O que passa a ser proibido

- Importar `~icons/*` fora de `src/assets/icons`.
- Reinstalar `lucide-react` ou outra biblioteca de ícones em paralelo.

## Como saber que erramos

- Se o chunk de ícones passar de 60 kB gzip, o registro virou depósito: revisar ícones sem uso ou partir o
  registro por área.
- Se a conferência com o Figma mostrar que os ícones do wireframe são de outro conjunto, a escolha precisa ser
  refeita junto com o design, não só no código.

## Referências

- `src/assets/icons/index.ts` e `vite.config.ts` (configuração do plugin).
- Regras de empacotamento — `CLAUDE.md` §3.
