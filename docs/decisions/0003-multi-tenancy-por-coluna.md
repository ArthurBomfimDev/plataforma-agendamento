# ADR-003 — Multi-tenancy por coluna `business_id`, com filtro global e RLS

- **Status:** Aceito
- **Data:** 2026-09-09
- **Decisores:** Arthur Bomfim, Rafael Ernandes
- **Módulos afetados:** Tenancy, Catalog, Availability, Scheduling, Reputation, Compliance
- **Substitui:** —
- **Substituído por:** —

---

## Contexto

Cada `Business` é um tenant: a barbearia não pode ver a agenda, os serviços, os profissionais
nem os agendamentos da clínica ao lado. Vazamento entre tenants é a falha mais grave que este
sistema pode ter — pior que indisponibilidade, porque é irreversível e, em empresa de categoria
sensível, envolve dado de saúde sob o Art. 11 da LGPD.

**Fatos que restringem a escolha:**

- Duas pessoas operam o sistema; não há DBA nem time de plataforma.
- A hospedagem será free tier ou quase, com limite de conexões apertado.
- O número de tenants no piloto é **30 empresas semeadas**, não milhares.
- O `Customer` é conta **global**, fora do tenant (ADR-004) — a mesma pessoa agenda na
  barbearia e na clínica com uma conta só. Qualquer isolamento precisa acomodar isso.

## Problema

Como isolar os dados de cada `Business` com garantia forte, sem introduzir custo operacional
que a dupla não consegue sustentar?

## Alternativas consideradas

### A — Banco por tenant

**A favor:** isolamento físico. Vazamento por consulta mal escrita é impossível. Backup e
restauração por empresa são triviais.

**Contra:** cada migration precisa rodar N vezes, e uma falha parcial deixa o sistema em
estados divergentes. O pool de conexões multiplica por tenant — inviável em free tier.
Onboarding de empresa deixa de ser um `INSERT` e vira provisionamento de infraestrutura.
Consulta que atravessa tenants — que é exatamente a **busca do marketplace**, o coração do
produto — passa a exigir agregação entre bancos. **Rejeitada:** o custo operacional é
incompatível com a equipe, e o modelo briga com o caso de uso principal.

### B — Schema por tenant

**A favor:** isolamento razoável, um banco só.

**Contra:** herda o problema de migration multiplicada e o de busca entre tenants. O EF Core
precisa de `DbContext` por schema ou de troca de `search_path` por requisição, o que conflita
com o pool de conexões. Ganha menos que A e custa quase o mesmo. **Rejeitada.**

### C — Coluna `business_id` com filtro global do EF Core

**A favor:** migration única. Um pool. Busca entre tenants é uma consulta comum. Onboarding
é um `INSERT`. O filtro global aplica o predicado automaticamente em toda consulta da entidade.

**Contra:** o isolamento passa a depender de código de aplicação. `IgnoreQueryFilters()`,
SQL cru, um `DbContext` construído sem o contexto de tenant, ou uma entidade nova que alguém
esquece de configurar — qualquer um desses fura o isolamento silenciosamente.

### D — Coluna `business_id` + filtro global + **Row Level Security** do PostgreSQL

**A favor:** tudo de C, e a última linha de defesa passa a ser do banco. Mesmo que o filtro
do EF Core falhe, a policy do PostgreSQL recusa a linha.

**Contra:** RLS exige uma variável de sessão (`SET LOCAL app.business_id`) definida por
transação. Com pool de conexões, uma variável que vaze entre requisições é um bug pior do
que o que se quis evitar. Exige disciplina em toda abertura de conexão.

## Decisão

Adotamos **D**, em três camadas, na ordem em que falham:

1. **Coluna `business_id`** em toda entidade de negócio, com índice composto começando por ela.
2. **Filtro global do EF Core**, alimentado por um `ITenantContext` resolvido do claim do JWT.
   Pega o caso comum e é transparente para quem escreve consulta.
3. **Row Level Security no PostgreSQL**, com `SET LOCAL app.business_id` dentro da transação —
   `LOCAL` e não `SESSION`, justamente para o valor morrer no fim da transação e nunca
   sobreviver no pool.

Somam-se dois testes que rodam no CI:

- **Teste de vazamento:** autentica como empresa A e tenta ler recurso da empresa B por ID
  direto. Exige 404, não 403 — 403 já confirma que o recurso existe.
- **Teste de cobertura:** varre por reflexão as entidades que herdam da base multi-tenant e
  falha se alguma não tiver filtro global configurado. É o que impede que uma entidade nova
  entre sem isolamento.

**O `Customer` fica fora deste regime.** É conta global (ADR-004); a relação entre empresa e
consumidor é derivada dos agendamentos, não de uma linha `business_id` no perfil.

## Consequências

### O que fica mais fácil

- Migration única, um pool de conexões, onboarding instantâneo.
- A busca do marketplace, que atravessa tenants por natureza, é uma consulta normal.
- O vazamento passa a exigir **três** falhas simultâneas, não uma.

### O que fica mais difícil

- Toda entidade nova precisa de `business_id`, de filtro global e de policy RLS. O teste de
  cobertura existe porque essa é a etapa que se esquece.
- Consulta administrativa legítima que atravessa tenants (papel `Admin`) precisa de caminho
  explícito e auditado — não pode simplesmente ignorar o filtro.
- RLS torna a depuração menos óbvia: uma consulta correta pode devolver zero linhas por causa
  de uma variável de sessão ausente, e o sintoma não aponta para a causa.

### O que passa a ser proibido

- `IgnoreQueryFilters()` fora de código administrativo explicitamente auditado.
- SQL cru que toque tabela multi-tenant sem predicado de `business_id`.
- Devolver **403** para recurso de outro tenant. A resposta é **404** — 403 confirma existência.

## Como saber que erramos

- Se o teste de vazamento pegar um caso real em produção, a camada 2 falhou e a 3 salvou —
  registrar como evidência e investigar por que o filtro não aplicou.
- Se a variável de sessão do RLS vazar entre requisições no pool, a camada 3 vira risco em vez
  de proteção e precisa ser desligada até haver correção.
- Se o número de tenants crescer a ponto de o índice por `business_id` deixar de ser seletivo,
  a premissa de escala deste ADR expirou.

## Referências

- `PROJECT-CONTEXT.md` §4 decisão 14
- `docs/produto/modelo-de-dominio.md` §4 (`Business`), §11 (Compliance)
- ADR-004 — conta global do consumidor
- LGPD Art. 11 — dado sensível em empresa com `IsSensitiveCategory = true`
