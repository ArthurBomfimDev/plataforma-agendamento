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

## Revisão de 04/11/2026 — radical, grupos de sinônimos e Saúde

**Fato (defeito observado):** buscar "barbeiro" em Garça devolvia 0 resultado, embora existam barbearias no seed. O
termo só casava se aparecesse inteiro no texto, e as barbearias se chamam "Barbearia …" ou têm o serviço "Barba".

**Decisão (continua Proposto):** além da normalização e do dicionário, `SearchText` passa a comparar por **radical
simples do português** e por **grupos de sinônimos**.

- **Radical** (`SearchText.Stem`): tira o plural, um sufixo de profissão ou lugar (-eiro, -eira, -aria, -ista, -or,
  -ora) e a vogal final. "barbeiro", "barbearia" e "barba" dão `BARB`; "manicuri" e "manicure", `MANICUR`. Palavra
  curta (até 4 letras) não perde nada, porque um radical curto casaria com palavra demais.
- **Grupos** (troca de igual para igual): barbeiro/barbearia/barba/corte masculino · manicure/pedicure/unha/esmalteria ·
  massagista/massagem/massoterapia · personal/treino/treinamento · psicólogo/psicóloga/psicologia/psicoterapia ·
  nutricionista/nutrição · fisioterapeuta/fisioterapia · fonoaudiólogo/fonoaudiologia/fono. O grupo casa pelo radical do
  que foi digitado, então "barbeiros" e "barbearia" caem no mesmo. Frase de várias palavras ("corte masculino") casa
  inteira. O dicionário antigo (cabelo, sobrancelha, pele, massagem → serviços) continua para a "necessidade → serviço".
- **Saúde na busca (decisão de 04/11, que reverte uma versão anterior desta revisão):** o resultado mostra o serviço e
  o preço em **todas** as categorias, Saúde inclusa. Uma primeira versão tirava `ServiceId`, `ServiceName` e
  `DurationMinutes` do resultado de Saúde; o Arthur decidiu o contrário. "Saúde não cita o serviço" continua valendo em
  e-mail, título e descrição do `.ics`, feed de agenda e avaliações, e não na busca.

**Limites novos:**

- Radical curto traz ruído: `BARB` também casa "Studio Bárbara". A comparação continua por trecho do texto, como antes.
- O radical não resolve tudo: "psicologia" só acha "psicólogo" porque os dois estão no mesmo grupo; palavra fora dos
  grupos e do dicionário cai na comparação simples.
- Continua em memória, sobre até 500 candidatos. Sem migration.

**Prova:** `SearchTextTests` (radical, grupos, termo sem relação) e `SearchBusinessesQueryTests` (a busca de ponta a
ponta com repositório e catálogo falsos: as mesmas barbearias para "barbeiro", "barbearia" e "barba"; "manicuri" e
"unha"; "advogado" não traz nada; Saúde e Beleza com serviço e preço no resultado). O comportamento contra o banco
real (H7, H8) não foi rodado nesta rodada.

## Consequências

- **Positivas:** sem extensão nem migration; o mesmo comportamento em qualquer PostgreSQL. Testável sem banco
  (`SearchTextTests`) e com banco (H7, H8). Trocar de abordagem depois é trocar uma classe.
- **Negativas e limites:**
  - Escala: a comparação roda sobre até 500 candidatos e todos os serviços ativos deles. Cabe no recorte
    (30 estabelecimentos no seed, RNF-01 medido em `docs/tcc/evidencias/rnf-01-busca.md`), mas uma cidade grande
    precisaria levar o filtro de texto para o banco (alternativa 1 ou 2).
  - Radical simples (revisão de 04/11): "cortando" ainda não casa com "corte"; não há lematização completa.
  - Sinônimo é manual: termo fora do dicionário só casa pelo texto. Um sinônimo largo demais traz ruído; "salão"
    em "cabelo", por exemplo, também traz o salão que só faz unha.
  - Não há "nicho" do estabelecimento no domínio (só a categoria, ADR-015). O nome do estabelecimento faz esse
    papel ("Barbearia", "Esmalteria").
