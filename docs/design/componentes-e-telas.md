# Componentes e telas — Etapas 5 e 6 concluídas

> Complementa `docs/design/eixo-paleta-tipografia.md` (eixo, paleta, tipografia, tokens).
> Arquivo Figma: `https://www.figma.com/design/E2M0TJehjcrSk4uaXlHI0s`
> **Última atualização:** 2026-09-09 · alinhado à **revisão 2** da paleta e da tipografia.
>
> ⚠️ **Documento parcialmente desatualizado (nota de 26/10).** Os hex citados aqui (`#0B7690`, `#7E7E7B`) são da R2 e estão **mortos** — vale a R5 em `eixo-paleta-tipografia.md`. A marca já existe (`marca-vagoo.md`) e o modo escuro foi implementado. A Etapa 7 (§6) foi executada no Figma: hoje são ~50 telas em 8 páginas (ver §10 do doc de paleta). Atualização completa pendente com o Rafael, a partir do Figma.

## 1. Estrutura do arquivo

| Página | Conteúdo |
|---|---|
| `Design System` | 11 component sets, 18 ícones, 7 estilos de texto, 1 estilo de efeito |
| `Page 1` | 20 telas: 12 originais aplicadas + 8 versões desktop do consumidor |

Tudo em **IBM Plex Sans**, família única. Ação em `#0B7690`, borda interativa em `#7E7E7B`.

## 2. Componentes (Etapa 5)

Auditoria: **215 nós verificados, zero valor hardcoded** — nenhum fill, stroke, padding, gap ou raio fora de variável.

| Component set | Variantes | Segundo canal / decisão |
|---|---|---|
| **Botão** | 12 (`primary·secondary·ghost` × `md·lg` × `default·disabled`) | `md` com altura mínima 44px |
| **Chip de status** | 7 | ícone próprio + forma de borda distinta por estado |
| **Campo** | 4 (`default·focus·error·disabled`) | valor sempre 16px; erro ganha ícone ✕ + texto de ajuda |
| **Card** | 3 (`estabelecimento·serviço·pedido`) | sombra a 6% — hierarquia vem do neutro, não da elevação |
| **Avatar** | 6 (`sm·md·lg` × `foto·iniciais`) | fallback de iniciais sobre `action/soft` |
| **Item de lista** | 3 (`chevron·status·preço`) | o elemento à direita define o papel da linha |
| **Célula de calendário** | 5 | **44×44**, padding vertical 12, centralizado. Feriado com dois estados: aberto e fechado |
| **Célula de agenda** | 5 | ⚠️ ver §5 — precisa virar `Bloco de agenda` |
| **Chip de horário** | 3 | `selected` ganha borda 2px além do fill; `disabled` ganha risco |
| **Badge** | 5 | verificado · urgente · transbordo · sensível · neutro |
| **Divisória** | 2 | `border/subtle`, decorativa por definição |

### Decisões

- **11 sets, não 10.** *Célula de calendário* (dia do mês, vitrine) e *Célula de agenda* (painel) foram separadas: os estados não coincidem e uma matriz única produziria combinações falsas.
- **Ícones como componentes** (20×20, traço 2px), cor sobrescrita por variável em cada uso. Evita explosão de variantes por ícone.
- **Estilos de texto ligados a variáveis**: família, peso, tamanho e altura de linha apontam para a coleção `type`.

### Defeitos encontrados por validação e corrigidos

1. Cards em *hug* horizontal vazavam o texto descritivo → largura fixa 344px com quebra de linha.
2. `itemSpacing` do Botão hardcoded em 8 → ligado a `space/8`.
3. **`Célula de calendário` ficou 44×20px com padding zero**, amassando a grade e violando o alvo de toque → corrigido para 44×44. **Origem da regra de geometria (§8 do doc de paleta).**

## 3. Telas (Etapa 6)

Auditoria: **20 telas, 1.379 nós, 392 instâncias, 0 instâncias soltas, 0 cores hardcoded.**

| # | Tela | Mobile 390 | Desktop 1440 |
|---|---|---|---|
| 01 | Home — busca e descoberta | ✅ | ✅ `01D` |
| 02 | Resultados da busca | ✅ | ✅ `02D` |
| 03 | Página do estabelecimento | ✅ | ✅ `03D` |
| 04 | Escolher profissional | ✅ | ✅ `04D` |
| 05 | Calendário e horários | ✅ | ✅ `05D` |
| 06 | Confirmação do pedido | ✅ | ✅ `06D` |
| 07 | Pedido enviado (pendente) | ✅ | ✅ `07D` |
| 08 | Meus agendamentos | ✅ | ✅ `08D` |

Painel do estabelecimento, 1280×800: **09** Agenda do dia · **10** Pedidos pendentes · **11** Cadastro de serviço · **12** Jornada e bloqueio de período.

### Padrões de adaptação mobile → desktop

- **Navegação:** barra inferior fixa de 3 itens no mobile → barra superior com busca embutida no desktop.
- **Contêiner:** 1200px no desktop (760px nas telas de decisão única — confirmação e pedido enviado), centralizado, respiro de 40px.
- **Uma coluna → duas:** estabelecimento e calendário ganham painel lateral de agendamento; resultados ganham coluna de filtros de 280px.
- **Rodapé fixo → linha de ação** alinhada à direita.
- **Linha do tempo do pedido:** vertical no mobile, horizontal em quatro colunas no desktop.

### Regras do produto visíveis nas telas

- **Feriado aparece nos dois lados**, mesmo quando a empresa abre (§5 do `PROJECT-CONTEXT.md`).
- **Expiração do pedido é sempre textual**, nunca só cromática.
- **"Sem horário nos próximos 7 dias"** é um estado desenhado, não uma ausência.
- **Escolha obrigatória no bloqueio de período**: os 3 agendamentos afetados aparecem com seus chips `Confirmado` antes das opções; padrão é "Manter os existentes".
- **Alvo de toque de 44px** via `size/touch-min`.

## 4. Agenda do dia — refeita com eixo de tempo contínuo

A primeira versão usava grade de linhas de hora cheia, uma célula por hora. Isso **perdia informação** e foi corrigido:

- Compromissos fora da hora cheia (10:30) não tinham onde existir.
- Um serviço de 90 min ocupava o mesmo espaço visual que um de 20 min.
- Os buracos entre atendimentos — a informação que o dono realmente procura — sumiam.

Versão vigente: eixo de tempo contínuo de **09:00 às 16:00, 1,23 px por minuto**, blocos posicionados no horário real com altura proporcional à duração. Os quatro indicadores do topo viraram uma linha compacta para devolver altura à grade.

## 5. Pendências abertas

- ⚠️ **`Célula de agenda` está obsoleta.** Foi desenhada para a grade de hora cheia e não descreve mais como a agenda funciona. Deve virar **`Bloco de agenda`**, com altura variável, preservando os cinco estados (livre, ocupado, bloqueado, fora do expediente, feriado).
- **Painel em mobile.** A decisão anterior de que o painel seria apenas desktop está **revogada** (ADR-009). Motivo: no cenário brasileiro, quem trabalha sozinho — barbeiro, manicure — tem celular e não tem computador. Restringir ao desktop decide quem pode usar o sistema; é decisão de inclusão, não de conveniência. As telas devem ser desenhadas para alguém operando com uma mão, em pé, entre atendimentos.
- ~~**Nome da marca**~~ — resolvido: Vagoo (`marca-vagoo.md`).
- ~~**Modo escuro:** fora de escopo~~ — revogado: implementado na R4/R5 e no código.

## 6. Próxima etapa — Etapa 7 (executada no Figma; registro original mantido)

**Trabalho 1 — paridade mobile do painel (390×844), em página nova.**
A Agenda do dia exige redesenho, não refluxo: um profissional por vez, seletor horizontal no topo, dia como lista cronológica. As demais refluem para uma coluna. Relatórios: cartões empilhados, um gráfico, tabela com rolagem horizontal ou só exportação CSV.

**Trabalho 2 — telas faltantes, mobile e desktop.** Prioridade alta: login e cadastro (consumidor e estabelecimento) · recuperação de senha e confirmação de e-mail · consentimento LGPD · onboarding da empresa (checklist, envio, em análise, recusado com motivo) · cancelamento pelo consumidor · marcação de balcão · agenda do dia do profissional com concluído e no-show.

**Estados vazios e de erro.** A tela de **HTTP 409 — horário acabou de ser ocupado** é a mais importante da lista: é a constraint de exclusão do banco aparecendo na interface, e é o que mais provavelmente acontece numa demonstração com dois avaliadores simultâneos. Ela precisa sugerir os horários alternativos mais próximos e permitir reagendar sem voltar ao início.
