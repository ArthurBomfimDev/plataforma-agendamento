# ADR-015 — Categoria como enum

- **Status:** Proposto
- **Data:** 2026-10-26
- **Decisores:** Arthur Bomfim, Rafael Ernandes
- **Módulos afetados:** Tenancy, Catalog, Compliance, Scheduling
- **Substitui:** —
- **Substituído por:** —
- **Relaciona:** ADR-010 (emenda de 2026-10-01 — `Category` fora da regra 2)

---

## Contexto

**Fato.** O modelo de domínio de 03/09 tinha `Category` como entidade, e a ADR-010 (regra 2) a incluía na
lista de cadastros que podem usar `Base/`.

**Fato.** A categoria decide o regime de dado sensível: em categoria de saúde, o próprio agendamento é dado
sensível (LGPD Art. 11), com consentimento que bloqueia, ausência em página pública e log de acesso. Essa
chave é `RequiresSensitiveHandling`.

**Fato.** O MVP tem duas categorias: Beleza e Saúde.

**Fato.** Decisão de 22/09 (`docs/produto/decisoes-localizacao-notificacao-modelo.md` §4). A emenda de
2026-10-01 da ADR-010 tirou `Category` da lista permitida do `Base`, porque deixou de ser entidade. Faltava
registrar o motivo de ser enum.

**Fato, estado do código em 26/10.** `BusinessCategory` é enum (`Beleza`, `Saude`) com a extensão
`RequiresSensitiveHandling()`, que devolve `true` só para `Saude`. O `Appointment` grava `IsSensitive` na
criação, a partir dessa extensão.

## Problema

Categoria deve ser dado editável no banco ou valor fixo no código?

## Alternativas consideradas

### A — Tabela `category`, com `RequiresSensitiveHandling` como coluna

**A favor:** categoria nova sem deploy; base pronta para subcategorias.
**Contra:** um `UPDATE` desliga o regime do Art. 11 de uma vertical inteira, sem revisão de código e sem
rastro no histórico do repositório. Uma tabela, um join e uma migration a mais para dois valores.

### B — Enum em código

**A favor:** a chave jurídica só muda por código revisado; o regime de dado sensível não pode ser desligado
por acidente nem por quem tem acesso ao banco.
**Contra:** categoria nova exige deploy; subcategoria exige virar tabela.

## Decisão

Adotamos **B**. A categoria é o enum `BusinessCategory`, e `RequiresSensitiveHandling()` é uma função do
código, não um dado.

Vira tabela quando aparecer subcategoria (Barbearia, Salão, Estética dentro de Beleza) ou quando o
estabelecimento puder propor categoria — por ADR nova.

## Consequências

### O que fica mais fácil

- O capítulo de conformidade afirma que o regime do Art. 11 não pode ser desligado por alteração de dado.
- Some uma tabela, um join e uma migration.

### O que fica mais difícil

- Categoria nova precisa de deploy.
- A categoria é gravada como texto no banco: renomear um valor do enum sem migration quebra os registros
  existentes.

### O que passa a ser proibido

- Tornar `RequiresSensitiveHandling` configurável por dado (coluna, tabela, configuração).
- Usar `Category` com as abstrações de `Base/`.

## Como saber que erramos

- Se o produto precisar de subcategoria antes da entrega.
- Se o deploy para categoria nova virar gargalo real — o que, com duas categorias, não se espera no MVP.

## Referências

- `docs/produto/decisoes-localizacao-notificacao-modelo.md` §4
- ADR-010 — regra 2 e emenda de 2026-10-01
- `backend/src/Core/Booking.Domain/Enum/Module/Tenancy/BusinessCategory.cs`
