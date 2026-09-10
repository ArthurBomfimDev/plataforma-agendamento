# Componentes e telas — Etapas 5 e 6 concluídas

> Complementa `docs/design/eixo-paleta-tipografia.md` (eixo, paleta, tipografia, tokens).
> Arquivo Figma: `https://www.figma.com/design/E2M0TJehjcrSk4uaXlHI0s`
> **Última atualização:** 2026-09-06

## 1. Estrutura do arquivo

| Página | Conteúdo |
|---|---|
| `Design System` | 11 component sets, 18 ícones, 7 estilos de texto, 1 estilo de efeito |
| `Page 1` | 20 telas: 12 originais aplicadas + 8 versões desktop do consumidor |

## 2. Componentes (Etapa 5)

Auditoria automática: **215 nós verificados, zero valor hardcoded** — nenhum fill, stroke, padding, gap ou raio fora de variável.

| Component set | Variantes | Segundo canal / decisão |
|---|---|---|
| **Botão** | 12 (`primary·secondary·ghost` × `md·lg` × `default·disabled`) | `md` com altura mínima 44px; `secondary` com borda `border/interactive` |
| **Chip de status** | 7 | ícone próprio + forma de borda distinta por estado |
| **Campo** | 4 (`default·focus·error·disabled`) | valor sempre 16px; erro ganha ícone ✕ + texto de ajuda |
| **Card** | 3 (`estabelecimento·serviço·pedido`) | sombra a 6% — hierarquia vem do neutro, não da elevação |
| **Avatar** | 6 (`sm·md·lg` × `foto·iniciais`) | fallback de iniciais sobre `action/soft` |
| **Item de lista** | 3 (`chevron·status·preço`) | o elemento à direita define o papel da linha |
| **Célula de calendário** | 5 | feriado com **dois** estados: aberto e fechado |
| **Célula de agenda** | 5 | livre · ocupado · bloqueado · fora do expediente · feriado |
| **Chip de horário** | 3 | `selected` ganha borda 2px além do fill; `disabled` ganha risco |
| **Badge** | 5 | verificado · urgente · transbordo · sensível · neutro |
| **Divisória** | 2 | `border/subtle`, decorativa por definição |

### Decisões

- **Viraram 11 sets, não 10.** *Célula de calendário* (dia do mês, vitrine) e *Célula de agenda* (faixa de horário, painel) foram separadas: os estados não coincidem e uma matriz única produziria combinações falsas.
- **Ícones como componentes** (20×20, traço 2px, `stroke-linecap` redondo), cor sobrescrita por variável em cada uso. Evita explosão de variantes por ícone.
- **Estilos de texto ligados a variáveis**: `fontFamily`, `fontStyle`, `fontSize` e `lineHeight` de cada um dos 7 estilos apontam para a coleção `type`.
- **`Pendente` × `Confirmado`** validado visualmente: matiz, borda tracejada vs contínua, relógio vs check, vazado vs sólido. Separáveis em escala de cinza.

### Defeitos pegos pela validação e corrigidos

1. Cards em *hug* horizontal vazavam o texto descritivo → largura fixa 344px com quebra de linha.
2. `itemSpacing` do Botão ficou hardcoded em 8 → ligado a `space/8`.

## 3. Telas (Etapa 6)

Auditoria final: **20 telas, 1.379 nós, 392 instâncias de componente, 0 instâncias soltas, 0 cores hardcoded.**

### Consumidor — 390×844 (mobile) e 1440×900 (desktop)

| # | Tela | Mobile | Desktop |
|---|---|---|---|
| 01 | Home — busca e descoberta | ✅ | ✅ `01D` |
| 02 | Resultados da busca | ✅ | ✅ `02D` |
| 03 | Página do estabelecimento | ✅ | ✅ `03D` |
| 04 | Escolher profissional | ✅ | ✅ `04D` |
| 05 | Calendário e horários | ✅ | ✅ `05D` |
| 06 | Confirmação do pedido | ✅ | ✅ `06D` |
| 07 | Pedido enviado (pendente) | ✅ | ✅ `07D` |
| 08 | Meus agendamentos | ✅ | ✅ `08D` |

### Painel do estabelecimento — 1280×800

| # | Tela | Status |
|---|---|---|
| 09 | Agenda do dia | ✅ |
| 10 | Pedidos pendentes | ✅ |
| 11 | Cadastro de serviço | ✅ |
| 12 | Jornada e bloqueio de período | ✅ |

O painel **não** ganhou versão mobile: decisão registrada de que a agenda densa em 390px exige repensar a grade, não apenas refluxo.

### Padrões de adaptação mobile → desktop

- **Navegação:** barra inferior fixa de 3 itens no mobile → barra superior com busca embutida no desktop. O painel usa navegação lateral de 232px em todas as larguras.
- **Contêiner:** conteúdo do desktop limitado a 1200px (760px nas telas de decisão única — confirmação e pedido enviado), centralizado, com respiro de 40px.
- **Uma coluna → duas:** estabelecimento e calendário ganham painel lateral de agendamento; resultados ganham coluna de filtros de 280px.
- **Rodapé fixo → linha de ação:** o botão ancorado no rodapé do mobile vira uma linha de ação alinhada à direita no desktop.
- **Linha do tempo do pedido:** vertical no mobile, horizontal em quatro colunas no desktop.

### Regras do produto visíveis nas telas

- **Feriado aparece nos dois lados.** Na grade do consumidor (mobile e desktop), 7 de setembro carrega faixa pontilhada, fundo âmbar-claro e aviso textual — mesmo quando a empresa abre, conforme §5 do `PROJECT-CONTEXT.md`.
- **Expiração do pedido é sempre textual**, nunca só cromática: contador regressivo em `Pedido enviado`, em `Meus agendamentos` e no painel de pedidos.
- **"Sem horário nos próximos 7 dias"** é um estado desenhado, não uma ausência: caixa tracejada com ampulheta, em `Resultados` (mobile e desktop).
- **Escolha obrigatória no bloqueio de período** (tela 12): os 3 agendamentos afetados aparecem listados com seus chips `Confirmado` antes das opções, e a opção padrão é "Manter os existentes".
- **Transbordo do expediente** aparece como badge `Fora do horário` no pedido correspondente do painel.
- **Alvo de toque de 44px** aplicado a botões `md`, campos, chips de horário, células de dia e itens de navegação, via o token `size/touch-min`.

## 4. Próxima etapa

**Etapa 7 — telas faltantes.** Prioridade alta (a fatia vertical não fecha sem elas):

- Login e cadastro do consumidor · Login e cadastro do estabelecimento
- Recuperação de senha e confirmação de e-mail
- Consentimento LGPD para categoria sensível (bloqueia o agendamento, não avisa)
- Onboarding da empresa: checklist, envio para análise, em análise, recusado com motivo
- Cancelamento pelo consumidor, com a política visível
- Marcação de balcão (modal do painel)
- Agenda do dia do profissional, com marcar concluído e no-show

Estados vazios e de erro (os que mais aparecem em demonstração ao vivo): busca sem resultados · sem horário em 7 dias · estabelecimento fechado hoje · data é feriado (com e sem expediente especial) · horário acabou de ser ocupado (HTTP 409, com sugestão de alternativas próximas) · pedido expirado · erro 500 · offline · 404 · sessão expirada · permissão de localização negada · agenda vazia · nenhum pedido pendente · nenhuma avaliação ainda.

Menor prioridade: central de notificações · perfil do consumidor · formulário de avaliação · resposta do proprietário · relatórios · convite de colaborador.

**Pendências que continuam abertas:** o nome da marca (pendência A) — nada de logotipo, marca nominativa ou slogan até lá; o modo escuro, reservado para se sobrar tempo.
