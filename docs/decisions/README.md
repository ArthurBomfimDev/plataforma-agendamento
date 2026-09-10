# Decisões arquiteturais (ADRs)

Registro das decisões arquiteturais do projeto, no formato **Nygard**:
contexto · alternativas consideradas · decisão · consequências.

## Por que ADR

Uma decisão que não está escrita é uma decisão que será reaberta. Em um projeto de duas pessoas
com nove semanas e uma banca no fim, reabrir discussão fechada é o desperdício mais caro que existe.

O ADR também é **evidência acadêmica**: ele mostra que a escolha foi fundamentada, com alternativas
avaliadas, e não que caiu do céu. É o que separa "usamos monólito modular" de
"escolhemos monólito modular porque, nas condições X e Y, a alternativa custava Z".

## Como escrever

1. Copie `adr-template.md` para `NNNN-titulo-em-kebab-case.md`.
2. Numere sequencialmente. Número não é reaproveitado, mesmo se o ADR for recusado.
3. Escreva no passado para o contexto e no presente para a decisão.
4. **Nunca invente alternativa de palha.** Se só havia um caminho viável, diga isso e explique por quê.
5. Registre as consequências **ruins** também. ADR sem custo declarado não foi pensado.
6. Adicione a linha na tabela abaixo no mesmo PR.

## Status possíveis

| Status | Significado |
|---|---|
| `Proposto` | Em discussão, ainda não vale |
| `Aceito` | Vale agora. É a regra |
| `Substituído por ADR-NNN` | Não vale mais; outro ADR o sucedeu |
| `Revogado` | Não vale mais e nada o substituiu |

Um ADR aceito **nunca é editado nem apagado** — ele é substituído. O histórico é parte do valor.

---

## Índice

| ID | Título | Status | Data |
|---|---|---|---|
| [001](0001-stack-react-vite-dotnet-postgresql.md) | Stack: React + Vite + .NET 10 + PostgreSQL | ✅ Aceito | 2026-09-09 |
| 002 | Revogação da stack declarada no pitch | ⏳ Pendente | — |
| [003](0003-multi-tenancy-por-coluna.md) | Multi-tenancy por coluna `business_id` | ✅ Aceito | 2026-09-09 |
| [004](0004-identidade-papeis-conta-global.md) | Identidade, papéis e conta global do consumidor | ✅ Aceito | 2026-09-09 |
| [005](0005-dupla-reserva-constraint-exclusao.md) | Prevenção de dupla reserva por constraint de exclusão | ✅ Aceito | 2026-09-09 |
| [006](0006-slot-calculado-nao-persistido.md) | Slot calculado, não persistido | ✅ Aceito | 2026-09-09 |
| [007](0007-monolito-modular-fronteiras.md) | Monólito modular e fronteiras de módulo | ✅ Aceito | 2026-09-09 |
| 008 | Hospedagem e PostGIS | ⏳ Pendente — depende do spike | — |
| [009](0009-paridade-mobile-do-painel.md) | Paridade mobile do painel como decisão de inclusão | ✅ Aceito | 2026-09-09 |

### Notas sobre a fila

- **001 e 002 são par.** O 002 revoga publicamente a stack declarada no pitch entregue à FATEC
  (React Native + Node/NestJS + AWS). Sem ele registrado, a mudança lida pela banca é incoerência;
  com ele, é maturidade de engenharia.
- **005 e 006 sustentam o núcleo técnico do TCC.** São os dois ADRs que a banca tem mais chance
  de questionar e os que rendem mais se estiverem bem escritos.
- **008 depende do spike de infraestrutura** — confirmar `CREATE EXTENSION postgis` e `btree_gist`
  no candidato a hospedagem. É o maior risco técnico ainda não verificado do projeto.
- **009 tem peso acadêmico próprio**: paridade mobile como decisão de inclusão digital entra
  no capítulo de justificativa, não só no de arquitetura.
