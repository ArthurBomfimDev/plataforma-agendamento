# Eixo de marca, paleta e tipografia

> Arquivo Figma: `https://www.figma.com/design/E2M0TJehjcrSk4uaXlHI0s`
> **Última atualização:** 2026-10-09 · **Revisão 5 — marca Vagoo, paleta azul.**

---

## 0. Histórico

| | R1 (reprovada) | R2 | R3 | R4 | **R5** |
|---|---|---|---|---|---|
| Marca | sem nome | sem nome | sem nome | sem nome | **Vagoo** |
| Neutros | bege quente | cinza quase puro | cinza quase puro | idem + rampa escura | **slate frio (azulado)** |
| Primária | `#0F6E83` | `#0B7690` | `#0C7D99` | idem + `#4FC3DE` no escuro | **`#3B82F6` (azul)** |
| Fundo escuro | — | — | — | `#121211` | **`#070B14`** |
| Matizes de status | 6 | 3 | 3 | 3 | 3 |
| Famílias tipográficas | 2 | 1 | 1 | 1 | 1 |
| Célula de calendário | caixa por dia | caixa por dia | grade aberta, 5 estados | 7 estados + legenda | idem |
| Tracejado | 8 usos | 8 usos | 2 usos | 2 usos | 2 usos |
| Modos | 1 | 1 | 1 | 2 | 2 |

Nenhuma revisão exigiu refazer tela. A R5 trocou a identidade inteira do produto — marca, matiz primária, temperatura dos neutros e fundo do tema escuro — e custou **uma edição de 35 primitivas**. Zero alias alterado, zero nó tocado, zero tela refeita, nas 8 páginas e ~50 telas. É a prova mais forte da arquitetura primitiva → alias semântico, e é o número que vai para o TCC.

⚠️ **Hex antigos circulam em prompts e anotações.** Toda a paleta azul-água (`#0C7D99`, `#0F6E83`, `#0B7690`, `#4FC3DE`) e os neutros quentes (`#141413`, `#8C867B`) estão **mortos**. O arquivo Figma é a fonte da verdade.

---

## 1. Eixo

Base **"Precisão calma"**, calor de **"Ofício"**.

- **É:** clara · confiável · acolhedora
- **Não é:** corporativa · fria · genérica
- Quando calor e legibilidade brigarem, **legibilidade ganha**.

## 2. Decisão de risco registrada (capítulo de limitações)

A R5 **revoga a proibição de azul corporativo** que valia até a R4. A marca Vagoo é azul, e o sistema segue a marca. O custo precisa ser declarado no TCC em vez de escondido: azul é a cor mais disputada da categoria — Calendly, Google Calendar, Doctoralia e metade do SaaS brasileiro moram nessa faixa. A diferenciação agora depende inteiramente de **tipografia, forma, densidade e dos neutros frios**, não da matiz.

## 3. Paleta — modo Light

Nenhum par texto/fundo abaixo de **4,5:1**; nenhuma borda de componente interativo abaixo de **3:1**.

**Primária (azul):** `50 #EFF6FF` · `100 #DBEAFE` · `200 #BFDBFE` · `300 #93C5FD` · `400 #60A5FA` · **`500 #3B82F6`** · **`600 #2563EB`** · `700 #1D4ED8` · `800 #1E40AF` · `900 #172554`

**O azul da marca não pode ser o preenchimento do botão.** `#3B82F6` com texto branco dá **3,68:1** e reprova em AA para texto de interface. Ele passa só como texto grande, que é exatamente o uso dele no logotipo — por isso o ícone do app funciona e um botão não funcionaria. Solução sem perder a marca:

- `#3B82F6` mora em **`primary/500`** e é o azul da identidade: bordas, foco, ícones, estado selecionado, logotipo.
- **`action/primary` aponta para `primary/600` = `#2563EB`** (texto branco em **5,17:1**). Mesma família de matiz, lido como "aquele azul".

A alternativa seria manter `#3B82F6` no botão com texto quase preto. Reprova por outro motivo: contradiz o próprio logotipo, que é branco sobre azul.

**Neutros (slate frio):** `0 #FFFFFF` · `50 #F8FAFC` · `100 #F1F5F9` · `200 #E2E8F0` · `300 #CBD5E1` · `400 #94A3B8` · `500 #64748B` · `600 #475569` · `700 #334155` · `800 #1E293B` · `900 #0F172A`

Os neutros saíram de quentes para frios **por obrigação, não por gosto**: cinza bege ao lado de um fundo azul-marinho lê como sujeira. N500 (4,76 sobre branco) continua sendo borda de componente interativo e texto desabilitado.

**Status — três matizes, dois canais sempre:**

| Estado | fg | bg | Contraste | 2º canal |
|---|---|---|---|---|
| `Pending` | `#92400E` | `#FEF3C7` | 6,37 | **borda tracejada** + relógio |
| `Confirmed` | `#15803D` | `#DCFCE7` | 4,57 | preenchido + check |
| `Rejected` | `#B91C1C` | `#FEE2E2` | 5,30 | preenchido + ✕ |
| `NoShow` | `#B91C1C` | `#FEE2E2` | 5,30 | **borda de 2px** + pessoa-✕ |
| `Expired` | `#475569` | — | 7,58 | **vazado** + ampulheta |
| `Cancelled` | `#334155` | `#F1F5F9` | 9,90 | preenchido + barra |
| `Completed` | `#1E293B` | `#E2E8F0` | 11,87 | sem borda + check duplo |

✅ **Pendência resolvida.** O amarelo-oliva reprovado (`#6B5A00`/`#FFF8E1`) saiu. O âmbar `#92400E` sobre `#FEF3C7` entrega os mesmos 6,4 de contraste e funciona porque agora há contraste de temperatura: um âmbar quente contra neutros frios e um primário azul **grita atenção** de um jeito que o oliva contra neutros bege não conseguia. A cor não mudou de legibilidade; mudou de vizinhança.

**Regra do tracejado:** tracejado significa "provisório ou vazio". Dois usos: chip `Pending` e vão livre na agenda. Todo o resto usa borda sólida com barra de destaque à esquerda.

## 4. Paleta — modo Dark

O modo escuro **não troca nenhum alias**: inverte o papel das primitivas.

**Neutros (escuro):** `0 #0E1627` (superfície) · **`50 #070B14` (página)** · `100 #18233A` · `200 #243352` · `300 #334766` · `400 #46597A` · `500 #64748B` · `600 #8FA0B8` · `700 #B6C2D4` · `800 #D8E0EA` · `900 #F2F6FB`

`#070B14` é o fundo da marca. A superfície `#0E1627` fica um degrau acima para que card e página se separem sem borda.

**Primária (escuro):** `50 #0E1D33` · `100 #122742` · `200 #163257` · `300 #1C4480` · `400 #2563EB` · `500 #3B82F6` · **`600 #60A5FA`** · `700 #7FB6FB` · `800 #A6CCFC` · `900 #CBE1FE`

| Par | Escuro |
|---|---|
| texto de corpo sobre a página | **10,92** |
| texto secundário sobre superfície elevada | **6,54** |
| borda interativa sobre a página | **4,14** (≥3 ✅) |
| texto sobre o botão (`text/on-action` → `neutral/0`) | **7,10** |
| link sobre a página | 7,74 |
| link sobre superfície selecionada | 6,65 |

**Status (escuro):** `Pending` `#FCD34D` / `#2B1F08` (11,18) · `Confirmed` `#6EE7B7` / `#06281C` (10,37) · `Rejected` e `NoShow` `#FCA5A5` / `#2D1114` (9,21).

**A inversão automática resolve o botão sozinha.** `text/on-action` é `neutral/0`: branco no claro sobre azul profundo, azul-marinho quase preto no escuro sobre azul brilhante. Nenhuma regra extra.

**Exceções de alias por modo — três, e só três:**

- `bg/inverse` → `neutral/900` no claro, **`primary/200` no escuro** (senão os blocos ocupados da agenda viram três colunas de brilho)
- `text/on-inverse` → `neutral/0` no claro, **`neutral/900` no escuro**
- `bg/scrim` → `neutral/900` no claro, **`neutral/50` no escuro**

## 5. Marca

**Vagoo** — `AGENDE · ESCOLHA · VÁ`. O gradiente do logotipo (ciano → azul) existe como duas primitivas de escopo vazio, `primitive/brand/gradient-from` (`#22D3EE`) e `primitive/brand/gradient-to` (`#2563EB` no claro, `#3B82F6` no escuro). Elas são **exclusivas do logotipo e de peças de marca**. Gradiente não entra em interface: não tem como garantir contraste em cima de uma superfície que varia.

A pendência A (ausência de nome e marca) está **encerrada**.

## 6. Tipografia

**IBM Plex Sans, família única**, OFL, Latin Extended. Estilos: `Regular`, `Medium`, `SemiBold` (sem espaço).

| Token | px | Line-height | Peso |
|---|---|---|---|
| `display` | 32 | 38 | SemiBold |
| `title` | 24 | 31 | SemiBold |
| `heading` | 20 | 27 | SemiBold |
| `body-lg` | 18 | 28 | Regular |
| `body` | 16 | 24 | Regular/Medium |
| `label` | 14 | 20 | Medium |
| `caption` | 12 | 16 | Regular |

Piso de 12px. **Campo de formulário obrigatoriamente 16px** (abaixo disso o Safari do iOS dá zoom no foco). Altura de linha em px, não unitless. Três pesos apenas.

⚠️ O logotipo usa uma grotesca geométrica arredondada, que **não** é IBM Plex Sans. Isso é normal — logotipo é desenho, não tipografia de sistema. Não trocar a fonte da interface para imitá-lo.

## 7. Tokens

Quatro coleções. A de cor tem **dois modos: Light e Dark**. Zero `ALL_SCOPES`; todas com `codeSyntax` WEB.

`color` 89 (37 primitivas de escopo `[]` + 52 semânticas por alias) · `space` 18 (inclui `size/touch-min: 44`) · `radius` 6 · `type` 18.

Componentes e telas ligam **só** em tokens semânticos.

## 8. Regra de geometria — permanente

**Aplicar estilo nunca pode encolher um alvo de toque.** Origem: a `Célula de calendário` chegou a ficar 44×20 com padding zero. Hoje é grade aberta sem caixa por dia e continua **44×44**, ligada a `size/touch-min`.

Alvo de 44px vale para botão, campo, chip de horário, célula de calendário, célula de agenda, item de navegação, item de lista e ícone clicável.

## 9. Calendário — sete estados

Grade aberta, sem caixa por dia. Cada estado tem marcador próprio abaixo do número, e o feriado usa um canal separado (barra no topo, posicionada em absoluto para não disputar os 44px).

| Estado | Marcador | Significa |
|---|---|---|
| Disponível | ponto cheio | tem horário livre |
| Sem horário | anel vazado | abre, mas está lotado |
| Não abre | traço | domingo ou dia sem jornada |
| Passado | nenhum | data já foi |
| Selecionado | círculo cheio | a data escolhida |
| Feriado aberto | barra no topo + ponto | feriado com expediente |
| Feriado fechado | barra no topo + traço | feriado sem expediente |

**Legenda obrigatória** abaixo da grade — marcador sem legenda é enigma.

**Vários feriados no mês:** a barra no topo escala porque é canal independente. O que não escalava era a nota fixa; virou uma **linha de resumo do mês** ("Feriados em setembro: 7 · Independência"). A caixa que bloqueia fica reservada para quando o consumidor seleciona uma data de feriado.

**Muitos horários:** períodos com contagem (`Tarde · 12 horários`), expandidos ou recolhidos, em grade que quebra linha com rolagem vertical. **Carrossel foi descartado**: esconde opções atrás de um gesto, quebra a varredura vertical, é ruim com leitor de tela e piora o RNF-05.

## 10. Estrutura de páginas do arquivo

| Página | Conteúdo |
|---|---|
| `Design System` | 11 conjuntos de componentes, 18 ícones, estilos |
| `Autenticação` | A01–A07 |
| `Consumidor` | 01–14 mobile + 01D–08D desktop |
| `Painel — mobile` | P01–P05 |
| `Estabelecimento — onboarding` | E01 |
| `Autenticação — Dark` · `Consumidor — Dark` · `Painel mobile — Dark` | clones com o modo Dark fixado |
