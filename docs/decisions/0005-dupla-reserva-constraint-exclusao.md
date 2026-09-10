# ADR-005 — Prevenção de dupla reserva por constraint de exclusão no PostgreSQL

- **Status:** Aceito
- **Data:** 2026-09-09
- **Decisores:** Arthur Bomfim, Rafael Ernandes
- **Módulos afetados:** Scheduling, Availability
- **Substitui:** —
- **Substituído por:** —

---

## Contexto

Dupla reserva é a falha que destrói a confiança no produto. Duas pessoas na porta do salão às
14h, para o mesmo profissional, é o cenário que o sistema existe para impedir — e o que um
avaliador da banca vai tentar provocar.

**O caso difícil não é o óbvio.** Duas requisições HTTP simultâneas são o caso fácil. O caso
difícil é a **marcação de balcão** (`Source = Counter`): a recepcionista marca no painel no
mesmo instante em que alguém confirma pelo site. São dois caminhos de código diferentes,
possivelmente em instâncias diferentes, disputando o mesmo intervalo.

Complicações do domínio que a solução precisa absorver:

- O intervalo que ocupa o slot **não é a duração do serviço** — é
  `BufferBefore + Duration + BufferAfter` (`Appointment.Period` já inclui os buffers).
- Nem todo estado ocupa slot: `Pending`, `Confirmed`, `Completed` e `NoShow` ocupam;
  `Cancelled`, `Rejected` e `Expired` não. **`Pending` ocupa** — é o que impede que a espera
  pela aprovação manual vire porta para conflito.
- Adjacência não é conflito: 13:00–14:00 e 14:00–15:00 convivem.

## Problema

Como garantir que dois agendamentos que ocupam slot nunca se sobreponham para o mesmo
profissional, sob concorrência real, sem infraestrutura adicional?

## Alternativas consideradas

### A — Verificação em código antes do `INSERT`

**A favor:** trivial de escrever; mensagem de erro amigável.

**Contra:** é uma corrida clássica. Entre o `SELECT` que não encontra conflito e o `INSERT`,
outra transação insere. No nível de isolamento padrão do PostgreSQL (Read Committed), as duas
transações passam. **Rejeitada:** não é garantia, é probabilidade — e a probabilidade piora
justamente quando o sistema é mais usado.

### B — Lock distribuído em Redis

**A favor:** padrão conhecido; funciona entre instâncias.

**Contra:** introduz um serviço a mais para hospedar, monitorar e pagar, num projeto de
orçamento zero. Pior: a correção passa a depender de TTL, de relógio e de tratamento de
falha de rede — se o lock expira antes da transação terminar, a garantia evapora sem aviso.
E se o Redis cai, o sistema perde a garantia mais importante que tem. **Rejeitada:**
mais peças móveis e uma garantia mais fraca do que a alternativa D, com custo maior.

### C — Isolamento `SERIALIZABLE`

**A favor:** o PostgreSQL detecta a anomalia e aborta uma das transações. Garantia real,
sem infraestrutura nova.

**Contra:** exige *retry* em toda a aplicação, porque `serialization_failure` pode ocorrer
em qualquer transação — inclusive nas que nada têm a ver com agendamento. Impõe um custo
global para resolver um problema local. **Rejeitada** como mecanismo principal, mas o
raciocínio a favor sobrevive: a garantia deve vir do banco.

### D — Constraint `EXCLUDE USING gist` sobre profissional e período

**A favor:** o banco **recusa** a linha sobreposta. Não é verificação, é impossibilidade.
Vale para qualquer caminho de escrita — online, balcão, script de seed, `INSERT` manual no psql.
Custo de infraestrutura: zero, só a extensão `btree_gist`. Índice GiST torna a checagem barata.

**Contra:** exige `btree_gist` (restringe hospedagem — ADR-008). O erro chega como violação de
constraint e precisa ser traduzido em erro de domínio. Não cobre a regra de "cabe na jornada",
que continua sendo do `AvailabilityCalculator`.

## Decisão

Adotamos **D**, em três camadas:

**1. A garantia — constraint no banco.** Sobre `professional_id` e `period`, filtrando os
estados que ocupam slot:

```sql
ALTER TABLE scheduling.appointment
  ADD CONSTRAINT appointment_no_overlap
  EXCLUDE USING gist (
    professional_id WITH =,
    period          WITH &&
  ) WHERE (status IN ('Pending', 'Confirmed', 'Completed', 'NoShow'));
```

O `period` é `tstzrange` com limite `[)` — fechado no início, aberto no fim — que é o que faz
13:00–14:00 e 14:00–15:00 conviverem. E já inclui os buffers, porque é isso que `Appointment.Period`
significa (`docs/produto/modelo-de-dominio.md` §8).

**2. A experiência — transação e tradução do erro.** O caso de uso recalcula disponibilidade e
insere na mesma transação. A violação é capturada e traduzida em erro de domínio
`SlotNoLongerAvailable`, respondido como **HTTP 409 Conflict** com a lista de horários próximos —
não 500, e não uma mensagem genérica.

**3. A idempotência — chave do cliente.** Chave gerada no cliente, enviada no `POST`, com índice
único. Toque duplo no botão, retry de rede e reenvio de formulário devolvem o **mesmo**
agendamento em vez de criar dois. Resolve o problema que a constraint não vê: duas requisições
idênticas do mesmo usuário.

**Verificação contínua.** O CI do backend cria uma tabela com a constraint, insere um período,
tenta um sobreposto e **falha o build se o segundo for aceito**; depois confirma que outro
profissional no mesmo horário passa e que a adjacência passa. Isso prova a garantia, não só
que a extensão carrega.

**Evidência para o TCC.** Teste de integração com 50 requisições concorrentes para o mesmo
horário, exigindo exatamente uma confirmação e 49 respostas 409 — é o **RNF-03**, e é o
resultado mais forte e mais reproduzível do trabalho.

## Consequências

### O que fica mais fácil

- A garantia vale para todo caminho de escrita, inclusive o de balcão e o script de seed.
- Zero infraestrutura nova, zero custo, nada para monitorar.
- O teste de concorrência vira evidência acadêmica direta.

### O que fica mais difícil

- **A migration que cria a constraint é irreversível na prática**: se houver sobreposição
  em dados existentes, ela falha. Toda carga de dados precisa nascer consistente.
- `btree_gist` vira requisito duro de hospedagem, somado ao PostGIS.
- Mudar a lista de estados que ocupam slot exige recriar a constraint — o predicado `WHERE`
  faz parte da definição.
- Não cobre recursos compartilhados (sala, cadeira, equipamento). Se entrarem no escopo,
  serão **outra** constraint, sobre `resource_id`, não uma extensão desta.

### O que passa a ser proibido

- Confiar em verificação de conflito feita apenas em código de aplicação.
- Introduzir Redis ou lock distribuído para este problema.
- Responder 500 a um conflito de horário. É 409.
- Inserir agendamento por caminho que contorne a constraint.

## Como saber que erramos

- Se o teste de 50 requisições concorrentes deixar passar duas confirmações, a constraint
  está mal definida — provavelmente o predicado de estados ou o limite do range.
- Se a taxa de 409 em uso normal for alta o bastante para irritar, o problema é a UI mostrando
  slots velhos, e a correção é revalidar disponibilidade mais perto do envio — não afrouxar
  a constraint.
- Se nenhuma hospedagem viável oferecer `btree_gist`, este ADR cai junto com o ADR-008.

## Referências

- `docs/produto/modelo-de-dominio.md` §8.2 invariante 1, §8.4
- `PROJECT-CONTEXT.md` §4 decisão 15 · §9 RNF-03
- ADR-006 — slot calculado; ADR-008 — hospedagem e extensões
- `.github/workflows/backend-ci.yml`, passo "Provar a constraint de exclusão (ADR-005)"
- PostgreSQL, documentação de `CREATE TABLE ... EXCLUDE` e do módulo `btree_gist`
