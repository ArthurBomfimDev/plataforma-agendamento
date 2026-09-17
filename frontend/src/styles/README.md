# Tokens de design

## Fonte da verdade

O Figma. Este diretório **espelha** o que está lá — não decide nada.

Arquivo: `https://www.figma.com/design/E2M0TJehjcrSk4uaXlHI0s` · página **Design System**
Estado: 4 coleções · 128 variáveis · modo Light · arquitetura primitiva → alias semântico ·
`codeSyntax` WEB configurado como `var(--…)` · 11 component sets.

## Estado atual

✅ `tokens.css` está preenchido com a **revisão 2**, lida do Figma via MCP em **2026-09-09**.

Cobertura confirmada: `bg/*` · `text/*` · `border/*` · `action/*` · os 7 estados de
`status/<estado>/{fg,bg}` · os 5 estados de `agenda/*` · os 4 `marker/*` · elevação ·
`space` (2–24) · `radius` (sm, md, lg, full) · `type` (caption, label, body, heading).

Lacunas marcadas com `TODO(figma)` no arquivo, **nenhuma preenchida por aproximação**:
`action/primary-{hover,active,disabled}` · `space/{32,48,64}` · `radius/{none,xl}` ·
`type/{display,title,body-lg}` · `size/avatar-{sm,lg}`.

As **primitivas** (escala completa de azul-água e de neutros) têm escopo `[]` no Figma e
por isso não são expostas pelo MCP — de propósito, para que nenhum componente ligue nelas.
Este arquivo define só a camada semântica, que é onde os componentes devem ligar.

## ⚠️ Duas advertências

**A revisão 1 foi reprovada.** Se encontrar `#0F6E83`, `#8C867B`, `#8E5426`, `#C97F4A`,
neutros bege (matiz ~40°) ou Source Serif 4 em qualquer lugar do código, é resíduo —
remova. A revisão 2 usa ação `#0B7690`, borda interativa `#7E7E7B`, neutros quase puros,
três matizes de status e uma única família tipográfica.

**`docs/design/eixo-paleta-tipografia.md` está desatualizado.** O arquivo no repositório
é de 05/09 e descreve a revisão 1. Os valores aqui vieram do Figma, não dele.
Quem for confiar naquele documento vai reintroduzir a paleta reprovada.

## Como ressincronizar

O MCP do Figma já está conectado (autenticado como Rafael, assento Full):

```bash
claude mcp add --transport http figma https://mcp.figma.com/mcp
```

`get_variable_defs` devolve as variáveis ligadas a um nó. Nós úteis da página Design System:

| Nó       | Component set        | Cobre                                                          |
| -------- | -------------------- | -------------------------------------------------------------- |
| `19:26`  | Botão                | `action/*`, `text-on-action`, `bg-disabled`, radius, touch-min |
| `20:107` | Chip de status       | os 7 `status/*`                                                |
| `23:86`  | Célula de agenda     | os 5 `agenda/*`                                                |
| `22:74`  | Badge                | os 4 `marker/*`, `action-soft`                                 |
| `21:48`  | Campo                | `border-focus`, `border-error`, escala de texto                |
| `24:104` | Card                 | `bg-surface-raised`, `radius-lg`, elevação                     |
| `23:60`  | Célula de calendário | marcadores de feriado                                          |

Onde o nome do Figma divergir do CSS, **o Figma vence** — ajuste o CSS, não o Figma.

## As cinco regras

Estão no cabeçalho de `tokens.css`, em detalhe. Resumo:

1. Borda de componente interativo é **N500 `#7E7E7B`**, nunca N300 `#D2D2D0` — N300 dá
   1,51:1, reprova o contraste não-textual (WCAG 1.4.11) e derruba o RNF-04.
2. Campo de formulário obrigatoriamente **16px** — abaixo disso o Safari do iOS dá zoom no foco.
3. Altura de linha **em px**, nunca unitless — a grade de slots é calculada.
4. Tom claro de azul-água **nunca** é fundo de botão. `--action-soft` é superfície.
5. Status do agendamento em **dois canais** — cor + forma/ícone. Nunca só cor.
   `noshow` e `rejected` **compartilham o matiz**: o ícone e a borda pontilhada grossa
   não são enfeite, são o que os distingue.

## Como usar no componente

```css
/* ✔ */
.button-primary {
  background: var(--action-primary);
  color: var(--text-on-action);
  min-height: var(--size-touch-min);
  border-radius: var(--radius-md);
}

/* ✘ valor hardcoded onde existe token */
.button-primary {
  background: #0b7690;
}

/* ✘ tom claro como fundo de botão — reprova contraste */
.button-primary {
  background: var(--action-soft);
}
```

Valor hardcoded onde existe token é item do checklist de PR. O Figma foi auditado com
**zero valor hardcoded em 215 nós**; o código mantém o mesmo padrão.
