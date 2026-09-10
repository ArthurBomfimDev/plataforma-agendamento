# Eixo de marca, paleta e tipografia — aprovado

> Fecha parte da pendência **D** do `PROJECT-CONTEXT.md`. Nada aqui depende do nome da marca (pendência A).
> Arquivo Figma: `https://www.figma.com/design/E2M0TJehjcrSk4uaXlHI0s`
> **Última atualização:** 2026-09-05 · Etapas 1–4 concluídas (eixo, paleta, tipografia, tokens no Figma).

## 1. Eixo (Etapa 1 — aprovado)

Híbrido: **base "Precisão calma", calor de "Ofício"**.

- **É:** clara · confiável · acolhedora
- **Não é:** corporativa · fria · genérica
- **Hierarquia dura:** quando calor e legibilidade brigarem, legibilidade ganha. O calor vive nos neutros, no raio, na tipografia e na vitrine do consumidor — **nunca na cor de status**.
- Aproveitado do iFood/Airbnb: fundo claro dominante, neutro fazendo a maior parte do trabalho, uma cor sólida usada com disciplina, foto carregando o desejo. Isso é estrutura, não matiz.

## 2. Decisão de risco registrada (para o capítulo de limitações)

A primária foi definida como **azul-água assumido**, contra a recomendação inicial. Consequência declarada: **a marca será vizinha cromática de Calendly, Google Calendar e Doctoralia.** A diferenciação passa a depender de tipografia, forma e temperatura dos neutros.

Mitigações embutidas:
1. O azul-água é **escuro nos pontos de ação** (`#0F6E83`); o tom claro fica em superfície, nunca em botão.
2. O neutro é **quente** (matiz ~40°), o que separa a interface do cinza-azulado padrão da categoria.
3. A tipografia (Plex + Source Serif) é hoje a principal linha de separação da marca.

## 3. Paleta (Etapa 2 — aprovada)

Nenhum par texto/fundo abaixo de **4,5:1**; nenhuma borda de componente interativo abaixo de **3:1**. Meta do TCC: Lighthouse a11y ≥ 95 (RNF-04).

### Primária — azul-água
`50 #EAF7FA` · `100 #CDEDF3` · `200 #9CDBE7` · `300 #63C4D6` · `400 #34A8BF` · `500 #1B8AA1` · **`600 #0F6E83`** · `700 #0B5766` · `800 #09424D` · `900 #072F37`

- **600 é a cor de ação** — branco sobre ela dá 5,87:1. Tons claros de azul-água (~`#7DD3E0`) ficam em ~1,9:1 e por isso **nunca** são fundo de botão.
- 300 e 400 são decorativos: reprovam como texto.

### Secundária — argila (calor da direção A)
`100 #FBEFE6` · `300 #E9B98F` · `500 #C97F4A` (3,17:1 → só não-texto) · `700 #8E5426` (6,09:1 ✅)

Matiz 24° dessaturado — afasta do vermelho de delivery (5–10° saturado) e do dourado sobre preto.

### Neutros quentes (11 passos)
`0 #FFFFFF` · `50 #FAF9F7` · `100 #F4F2EE` · `200 #E8E5DF` · `300 #D6D2CA` · `400 #B3ADA3` · `500 #8C867B` · `600 #6B655B` · `700 #4E4941` · `800 #33302B` · `900 #1C1A17`

| Passo | /branco | Papel |
|---|---|---|
| 200 | — | **divisória decorativa** |
| 400 | 2,23 | ícone decorativo, placeholder — ❌ texto |
| 500 | **3,61** | **borda de componente interativo** (WCAG 1.4.11 ✅) |
| 600 | 5,77 | texto secundário |
| 700 | 8,92 | corpo |
| 800 | 13,14 | títulos |
| 900 | 17,36 | ênfase máxima |

⚠️ Borda de campo/botão-fantasma usa **N500**, nunca N300 (1,51:1 reprova o critério de contraste não-textual — é onde o Lighthouse costuma derrubar a nota).

### Status do agendamento — cor **+ segundo canal obrigatório**

| Estado | fg | bg | Contraste | 2º canal (não-cor) |
|---|---|---|---|---|
| `Pending` | `#96560A` | `#FDF1DC` | 5,17 | borda **tracejada** + ícone relógio + contador "expira em Xh" |
| `Confirmed` | `#1B7A4B` | `#E6F4EC` | 4,71 | preenchimento **sólido**, borda contínua + ícone check |
| `Rejected` | `#B3261E` | `#FBEAE8` | 5,61 | ícone ✕ em círculo contornado |
| `Expired` | `#6B655B` | `#F4F2EE` | 5,16 | borda tracejada + ícone ampulheta |
| `Cancelled` | `#4E4941` | `#F4F2EE` | 7,98 | **texto do serviço riscado** + ícone barra |
| `Completed` | `#33302B` | `#E8E5DF` | 10,45 | check duplo, chip sem matiz |
| `NoShow` | `#7A2E6B` | `#F6E9F3` | 7,35 | ícone pessoa-✕ + borda pontilhada grossa |

**`Pending` vs `Confirmed` diferem em quatro canais** (matiz, forma da borda, ícone, preenchimento) — requisito duro, já que aprovação manual é o padrão do produto.
**`Confirmed` não usa a primária de propósito:** se verde de confirmação e azul-água de ação fossem a mesma família, o chip de status competiria com o botão nas duas telas mais usadas.

### Estados da agenda

| Estado | Fill | Borda | 2º canal |
|---|---|---|---|
| Livre | `#FFFFFF` | N500 contínua | rótulo do horário em N700 |
| Ocupado | `#CDEDF3` | P600 contínua | nome do serviço + ícone pessoa |
| Bloqueado | `#F4F2EE` + hachura diagonal N400 | N500 tracejada | ícone cadeado + motivo |
| Fora do expediente | `#F4F2EE` liso | **sem borda** | célula não focável, sem rótulo |
| Feriado | `#FBEFE6` | N500 + **faixa superior pontilhada `#8E5426`** | ícone bandeira + nome do feriado |

Feriado **coexiste** com os demais: faixa e ícone permanecem mesmo quando a empresa abre e a célula está livre (regra do §5 do PROJECT-CONTEXT).

### Marcadores

| Marcador | Cor | 2º canal |
|---|---|---|
| Estabelecimento verificado | `#0F6E83` | ícone escudo-check + rótulo "Verificado" |
| Pedido expirando | `#96560A` / `#FDF1DC` | contador regressivo textual + borda tracejada animada |
| Transbordo do expediente | `#8E5426` | borda pontilhada + rótulo "fora do horário" |
| Categoria sensível (LGPD) | `#5B4B8A` / `#EFEBF7` | ícone cadeado + bloco de consentimento **que bloqueia o fluxo** |

Sensível é o único matiz fora das três famílias, de propósito: não pode ser confundido com status nem com marca (§14, Art. 11 da LGPD).

## 4. Tipografia (Etapa 3 — aprovada)

| Família | Papel | Licença | Eixos | Subsets |
|---|---|---|---|---|
| **IBM Plex Sans** | interface, corpo, dados, painel inteiro | **OFL** | `wght` 100–700, `wdth` 75–100 | latin, **latin-ext**, vietnamese, cyrillic, greek |
| **Source Serif 4** | só `display` e `title` da vitrine do consumidor | **OFL** | `wght` 200–900, **`opsz` 8–60** | latin, **latin-ext**, vietnamese, cyrillic, greek |

Licenças e subsets **verificados** nos `METADATA.pb` do repositório `google/fonts`. Estilos confirmados no Figma: `Regular`, `Medium`, `SemiBold` (sem espaço).

**Por que Plex Sans (legibilidade em 390px):** aberturas abertas em `a c e s`; `1 l I` desambiguados; **figuras tabulares (`tnum`)** — o produto empilha número em coluna (grade de horários, agenda do dia, quatro números do relatório) e sem largura fixa de dígito a coluna treme; eixo de largura 75–100 dá cabeçalho de tabela condensado no painel sem uma terceira família; Latin Extended com glifos desenhados para `ã õ ç â ê`.

**Por que Source Serif 4, e restrita:** o eixo `opsz` 8–60 entrega um corte desenhado para 32px — serifada estática nesse tamanho fica pesada ou com hairline que some no subpixel do Android. **Regra dura: zero serifada no painel de 1280px** (densidade alta com serifada aumenta o tempo de varredura da agenda do dia).

### Escala — 7 tamanhos

| Token | px | Line-height | Razão | Família / peso | Uso |
|---|---|---|---|---|---|
| `display` | 32 | 38 | 1,19 | Source Serif 4 · SemiBold | título de tela da vitrine |
| `title` | 24 | 31 | 1,29 | Source Serif 4 · SemiBold | título de seção, cabeçalho de modal |
| `heading` | 20 | 27 | 1,35 | Plex Sans · SemiBold | título de card, cabeçalho do painel |
| `body-lg` | 18 | 28 | 1,56 | Plex Sans · Regular | política de cancelamento, consentimento LGPD |
| `body` | 16 | 24 | 1,50 | Plex Sans · Regular/Medium | corpo padrão, **todo campo de formulário** |
| `label` | 14 | 20 | 1,43 | Plex Sans · Medium | rótulo, chip, botão, célula densa do painel |
| `caption` | 12 | 16 | 1,33 | Plex Sans · Regular | metadado, timestamp |

Regras da escala:

- Piso de 12px; `caption` nunca carrega informação exclusiva.
- **Campo de formulário obrigatoriamente 16px** — abaixo disso o Safari do iOS dá zoom no foco e desloca o layout (compromete o RNF-05).
- Altura de linha em **px, não unitless**, porque a grade de slots é calculada e a célula precisa de altura previsível.
- Três pesos apenas (Regular, Medium, SemiBold). Hierarquia vem de tamanho e cor.
- Carga: dois arquivos variáveis, subset `latin` + `latin-ext`, `font-display: swap`, pré-carga só do Plex Sans (mantém folga no RNF-04 perf ≥ 85).

## 5. Tokens no Figma (Etapa 4 — concluída)

Quatro coleções, modo único **Light**, **128 variáveis**, **zero `ALL_SCOPES`**, todas com `codeSyntax` WEB (`var(--…)`).

| Coleção | Variáveis | Conteúdo |
|---|---|---|
| `color` | 85 | 35 primitivas (escopo `[]`, invisíveis nos seletores) + 50 tokens semânticos por alias |
| `space` | 18 | `space/2…64` (escopo `GAP`) + `size/*` incl. `size/touch-min: 44` (escopo `WIDTH_HEIGHT`) |
| `radius` | 6 | `none · sm 6 · md 10 · lg 14 · xl 20 · full 999` (escopo `CORNER_RADIUS`) |
| `type` | 19 | `family/*` · `weight/*` · `size/*` · `line-height/*` (escopos `FONT_FAMILY`, `FONT_STYLE`, `FONT_SIZE`, `LINE_HEIGHT`) |

**Arquitetura:** primitiva → alias semântico. Componentes e telas ligam **só** em tokens semânticos; nenhuma primitiva aparece em seletor de propriedade. Trocar `primitive/primary/600` repropaga por todo o sistema.

Grupos semânticos: `bg/*` · `text/*` · `border/*` · `action/*` · `status/<estado>/{fg,bg}` (7 estados) · `agenda/*` · `marker/*`.

Modo escuro: **fora de escopo** por decisão, só se sobrar tempo.

## 6. Próximas etapas

5. Componentes base com variantes (botão, campo, card, chip de status, avatar, item de lista, célula de calendário, chip de horário, badge, divisória) — todas as propriedades ligadas a variáveis, zero valor hardcoded.
6. Aplicação nas 12 telas existentes, em lotes pequenos validados por screenshot.
7. Telas faltantes (login/cadastro, recuperação de senha, consentimento LGPD, onboarding da empresa, cancelamento, marcação de balcão, agenda do profissional, estados vazios e de erro).
