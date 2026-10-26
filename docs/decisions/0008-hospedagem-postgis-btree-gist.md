# ADR-008 — Hospedagem com PostGIS e `btree_gist`

- **Status:** Proposto — **decisão em aberto**, aguardando o spike de infraestrutura
- **Data:** 2026-10-26
- **Decisores:** Arthur Bomfim, Rafael Ernandes
- **Módulos afetados:** infraestrutura; Tenancy (busca geográfica); Scheduling (constraint de exclusão)
- **Substitui:** —
- **Substituído por:** —

---

## Contexto

**Fato.** O banco depende de duas extensões do PostgreSQL, ambas criadas pelas migrations:

- **PostGIS** — busca por raio com `ST_DWithin` sobre `geography` e índice GiST
  (`BusinessRepository.FindBookableNearbyAsync`).
- **`btree_gist`** — permite a igualdade em `professional_id` dentro da constraint `EXCLUDE USING gist`
  que impede dupla reserva (ADR-005, ADR-017).

Sem qualquer uma das duas, o sistema não sobe: a migration falha. O `CLAUDE.md` §1 e o `PROJECT-CONTEXT.md`
§4 tratam as extensões como **requisito duro de hospedagem**.

**Fato.** Localmente, o ambiente usa a imagem `postgis/postgis:17-3.5` no Docker Compose, e o CI cria
`btree_gist` e roda uma sonda da constraint de exclusão (`.github/workflows/backend-ci.yml`). Isso prova o
SQL, não o provedor.

**Fato.** Restrição de orçamento próxima de zero, com a ordem de preferência registrada no
`PROJECT-CONTEXT.md` §14: GitHub Student Pack → Azure for Students → camadas gratuitas → VPS pago em último
caso. A pendência I (e-mail `@fatec.sp.gov.br` para o Azure for Students) não tem resposta registrada desde
setembro.

**Fato.** O spike que confirmaria `CREATE EXTENSION postgis` e `CREATE EXTENSION btree_gist` em um
candidato **não foi feito**.

## Problema

Onde hospedar a demonstração de modo que as duas extensões funcionem, dentro do orçamento, e sem descobrir
a incompatibilidade na véspera da defesa?

## Alternativas consideradas

Os candidatos abaixo são os que a documentação do projeto cita. **Nenhum foi testado.** Esta ADR não
escolhe provedor: registra os candidatos e os critérios, e fica em `Proposto` até o spike.

### A — Banco gerenciado no Azure, via Azure for Students

**A favor:** crédito do programa de estudantes; é a primeira opção de custo zero da ordem registrada.
**Contra:** depende da pendência I. ⚠️ não verificado: se o plano do crédito cobre um PostgreSQL
gerenciado com PostGIS e `btree_gist` habilitáveis.

### B — PostgreSQL em camada gratuita de outro provedor

**A favor:** não depende do e-mail institucional.
**Contra:** ⚠️ não verificado: quais provedores permitem as duas extensões na camada gratuita, e com que
limites de conexão, armazenamento e hibernação. Camada gratuita tende a impor partida a frio, já declarada
como limitação no `DOCUMENTO-GERAL.md` §13.

### C — VPS com a mesma imagem do Docker Compose

**A favor:** as extensões vêm na imagem `postgis/postgis`; o ambiente da demonstração seria idêntico ao
local, sem surpresa de provedor.
**Contra:** custo (último caso da ordem registrada); manutenção, backup e TLS passam a ser do projeto.

## Critérios de decisão

O candidato escolhido precisa passar, nesta ordem:

1. `CREATE EXTENSION postgis` e `CREATE EXTENSION btree_gist` executam com o usuário que a aplicação usa.
2. As três migrations aplicam sem erro, incluindo a constraint `appointment_no_overlap`.
3. A sonda de exclusão do CI passa contra o banco hospedado.
4. Custo dentro do orçamento até dezembro de 2026.
5. Latência de partida a frio aceitável para a demonstração (sem limiar definido — ⚠️ não verificado).

## Decisão

**Em aberto.** Nenhum provedor está escolhido. A decisão entra nesta ADR, com o resultado do spike para
cada critério, antes de ela passar a `Aceito`.

## Consequências

### O que fica mais fácil

- O spike tem critérios fechados: não depende de opinião, depende de quatro comandos e uma conta.

### O que fica mais difícil

- Enquanto a decisão estiver aberta, a data da demonstração depende de um risco não medido. É o maior risco
  técnico não verificado do projeto (`docs/decisions/README.md`).

### O que passa a ser proibido

- Trocar PostGIS ou `btree_gist` por alternativa na aplicação (distância calculada em C#, checagem de
  sobreposição em código) para caber em um provedor. Isso desfaria a garantia da ADR-005.

## Como saber que erramos

- Se o provedor escolhido aceitar as extensões em desenvolvimento e recusar em produção, ou mudar o plano
  gratuito antes de dezembro.
- Se a partida a frio derrubar a primeira requisição da demonstração diante da banca.

## Referências

- ADR-001 — stack · ADR-005 — constraint de exclusão · ADR-017 — intervalo bloqueado em colunas gravadas
- `compose.yaml` · `.github/workflows/backend-ci.yml` (sonda de exclusão)
- `PROJECT-CONTEXT.md` §4 (decisão 4), §11 (pendências G e I), §14 (orçamento)
