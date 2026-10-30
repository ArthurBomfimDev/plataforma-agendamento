# ADR-024 — Busca por termo sem acento e com dicionário de sinônimos no código

- **Status:** Proposto
- **Data:** 2026-10-29
- **Decisores:** Arthur Bomfim, Rafael Ernandes
- **Módulos afetados:** Tenancy (busca), Catalog (`ServiceCatalog`)
- **Substitui:** —
- **Substituído por:** —

---

## Contexto

**Fato:** até a Onda 7CF, o termo da busca era comparado com `ILIKE` no nome do serviço e com
`OrdinalIgnoreCase` no nome do estabelecimento. "cabêlo" não achava nada, e "cabelo" também não, porque
nenhum serviço do seed se chama "cabelo": eles se chamam Corte, Escova, Coloração, Hidratação.

**Fato:** a busca já corta os candidatos pelo filtro geográfico antes do texto, com teto de 500
(`SearchBusinessesQuery`), e só os serviços ativos desses candidatos entram na comparação.

**Inferência:** quem procura escreve a necessidade ("cabelo", "unha", "massagem"), e o estabelecimento escreve o
serviço. Sem uma ponte entre os dois, a busca por termo falha justamente no caso mais comum.

## Problema

Como fazer "cabelo", "Cabelo", "cabêlo" e "corte" acharem o mesmo estabelecimento, sem infraestrutura nova?

## Alternativas consideradas

1. **Extensão `unaccent` do PostgreSQL**, com `unaccent(lower(name)) LIKE …` no banco. Resolve o acento, mas
   exige migration, e um índice funcional que use `unaccent` precisa de um wrapper `IMMUTABLE`. Não resolve sinônimo.
2. **Busca textual completa (`tsvector`, dicionário `portuguese`, tesauro).** Resolve acento, radical e sinônimo,
   mas o tesauro fica em arquivo do servidor do banco, fora do repositório e do controle da hospedagem
   (ADR-008, provedor em aberto).
3. **Normalização em memória e dicionário de sinônimos em código (escolhida).** Tirar acento, caixa e espaços
   extras em C# (`SearchText.Normalize`) e expandir o termo por um dicionário curto (`SearchText.Expand`) antes
   de comparar com o nome do serviço, do estabelecimento e da categoria.

## Decisão

Alternativa 3, em `Booking.Application.Common.Search.SearchText`, usada pela busca (`SearchBusinessesQuery`) e
pelo catálogo (`ServiceCatalog`). O termo casa se ele, o singular dele ("unhas" → "unha") ou um sinônimo aparece
no texto normalizado. A mesma normalização compara a cidade do filtro `City` (Onda 7C). Sem migration.

O dicionário é mantido no código, revisado em PR como qualquer regra. As entradas de cabelo, unha, sobrancelha,
pele e saúde cobrem os serviços do seed; a de massagem veio do pedido da onda e ainda não tem serviço no seed.

## Consequências

- **Positivas:** sem extensão nem migration; o mesmo comportamento em qualquer PostgreSQL. Testável sem banco
  (`SearchTextTests`) e com banco (H7, H8). Trocar de abordagem depois é trocar uma classe.
- **Negativas e limites:**
  - Escala: a comparação roda sobre até 500 candidatos e todos os serviços ativos deles. Cabe no recorte
    (30 estabelecimentos no seed, RNF-01 medido em `docs/tcc/evidencias/rnf-01-busca.md`), mas uma cidade grande
    precisaria levar o filtro de texto para o banco (alternativa 1 ou 2).
  - Sem radical: "cortes" vira "corte" pelo plural simples, mas "cortando" não casa.
  - Sinônimo é manual: termo fora do dicionário só casa pelo texto. Um sinônimo largo demais traz ruído; "salão"
    em "cabelo", por exemplo, também traz o salão que só faz unha.
  - Não há "nicho" do estabelecimento no domínio (só a categoria, ADR-015). O nome do estabelecimento faz esse
    papel ("Barbearia", "Esmalteria").
