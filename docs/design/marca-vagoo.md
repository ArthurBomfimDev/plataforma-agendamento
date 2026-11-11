# Marca Vagoo — ativos no Figma

> Arquivo: `https://www.figma.com/design/E2M0TJehjcrSk4uaXlHI0s` · página `Design System`, seção **Marca**
> Atualizado em 2026-10-09

## Identidade

**Vagoo** — `AGENDE · ESCOLHA · VÁ`. Símbolo: um "V" em velocidade que também é um pino de mapa, com um calendário confirmado dentro. Gradiente ciano → azul.

A pendência A (ausência de nome e marca) está encerrada.

## Componentes

| Componente | Variantes | Tamanho base | Proporção |
|---|---|---|---|
| `Logotipo` | `tema=Claro`, `tema=Escuro` | 140 × 47 | 2,99 : 1 |
| `Símbolo` | — | 40 × 41 | 0,98 : 1 |

Fundo **transparente** nos dois. Funcionam sobre qualquer superfície.

### Regra de uso

- **`tema=Claro`** — letreiro azul-marinho `#0F172A`. Superfícies claras.
- **`tema=Escuro`** — letreiro branco. Superfícies escuras.
- **`Símbolo`** — sem variante de tema: é só o gradiente ciano-azul, funciona nos dois.
- **O slogan não entra na interface.** A versão com `AGENDE · ESCOLHA · VÁ` fica na folha de marca. Abaixo de ~200px de largura o slogan vira borrão; em interface o logotipo nunca passa disso.
- **Não distorcer.** Qualquer redimensionamento mantém 2,99:1.

## Onde o logotipo aparece

| Lugar | O quê | Por quê |
|---|---|---|
| A01–A04 (autenticação, claro e escuro) | `Logotipo` 140 × 47 | É o primeiro contato; a pessoa precisa saber onde está entrando |
| 01D–08D (consumidor desktop, claro e escuro) | `Logotipo` 119 × 40 no cabeçalho | Cabeçalho persistente de 68px — é a âncora de navegação do site |
| A05–A07 (recuperação, confirmação, cadastro de estabelecimento) | nada | São etapas internas de um fluxo já identificado; repetir a marca é ruído |
| Painel do estabelecimento | nada | A barra lateral pertence ao **estabelecimento** ("Estúdio Duartina"). Pôr a marca da plataforma ali disputa identidade com o dono do salão, que é quem usa a tela o dia inteiro |
| Consumidor mobile | nada | 390px de largura é caro demais para gastar com marca em toda tela; a identificação acontece no login |

## Ativos de referência na seção Marca

`marca/lockup-claro` · `marca/lockup-escuro` · `marca/simbolo` — PNG transparente, exportado dos arquivos vetorizados.

## Pendências

- **Os três tiles de ícone de app** (azul, escuro, branco) existem nos arquivos vetorizados mas ainda não foram importados para o Figma
- Favicon
- Definir área de proteção (espaço mínimo em volta do logotipo) e tamanho mínimo de uso
- Os ativos no Figma são PNG transparente em resolução de interface. Para impressão, material gráfico ou qualquer uso acima de 300px, usar o arquivo vetorial original
