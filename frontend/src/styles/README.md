# Tokens de design

## Fonte da verdade

O Figma. Este diretório **espelha** o que está lá — não decide nada.

Arquivo: `https://www.figma.com/design/E2M0TJehjcrSk4uaXlHI0s` · página **Design System**
Estado: 4 coleções · coleção `color` com modos Light e Dark · arquitetura primitiva → alias semântico ·
`codeSyntax` WEB configurado como `var(--…)` · 11 component sets.

## Estado atual

✅ `tokens.css` está preenchido com a **revisão 3** (marca **vagoo**), lida do Figma via MCP
em **2026-10-10**. Ação em azul `#2563EB`, neutros frios (escala slate), status em âmbar,
verde e vermelho.

Cobertura confirmada: `bg/*` · `text/*` · `border/*` · `action/*` (com `primary-hover`) ·
os 7 estados de `status/<estado>/{fg,bg}` · `agenda/*` (com `blocked/hatch`) · os 4
`marker/*` · elevação · `space` · `radius` · `type`.

O **modo Dark** está no bloco `.dark` de `tokens.css`, mas nada aplica a classe ainda.

Lacunas marcadas com `TODO(figma)` no arquivo, **nenhuma preenchida por aproximação**:
`action/primary-{active,disabled}` · `space/{48,64}` · `radius/{none,xl}` · `size/avatar-sm`.

O Figma também expõe as **primitivas** (`--primitive-*`), mas nenhum componente liga nelas.
Este arquivo define só a camada semântica, que é onde os componentes devem ligar.

As variáveis do shadcn (`--primary`, `--muted`, `--ring`…) em `src/index.css` apontam para
esses tokens, então as primitivas de `components/ui` seguem a mesma paleta.

## ⚠️ Duas advertências

**Resíduo de revisão anterior se remove.** Revisão 1 (reprovada): `#0F6E83`, `#8C867B`,
`#8E5426`, `#C97F4A`, neutros bege, Source Serif 4. Revisão 2 (azul-água, substituída pela
marca): `#0C7D99`, `#0B7690`, `#7E7E7B`, `#F5FCFD`.

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

1. Borda de componente interativo é **neutral/500 `#64748B`**, nunca neutral/300 `#CBD5E1` —
   neutral/300 dá ~1,5:1, reprova o contraste não-textual (WCAG 1.4.11) e derruba o RNF-04.
2. Campo de formulário obrigatoriamente **16px** — abaixo disso o Safari do iOS dá zoom no foco.
3. Altura de linha **em px**, nunca unitless — a grade de slots é calculada.
4. Tom claro de azul **nunca** é fundo de botão. `--action-soft` é superfície.
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
  background: #2563eb;
}

/* ✘ tom claro como fundo de botão — reprova contraste */
.button-primary {
  background: var(--action-soft);
}
```

Valor hardcoded onde existe token é item do checklist de PR. O Figma foi auditado com
**zero valor hardcoded em 215 nós**; o código mantém o mesmo padrão.
