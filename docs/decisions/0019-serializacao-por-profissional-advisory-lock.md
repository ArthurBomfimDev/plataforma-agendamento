# ADR-019 — Serialização por profissional com advisory lock na criação de agendamento

- **Status:** Proposto
- **Data:** 2026-10-27
- **Decisores:** Arthur Bomfim, Rafael Ernandes
- **Módulos afetados:** Scheduling (persistência em `BookingDbContext`)
- **Substitui:** —
- **Substituído por:** —
- **Complementa:** ADR-005 (a constraint de exclusão continua sendo a garantia)

---

## Contexto

**Fato.** A ADR-005 entrega a garantia contra dupla reserva à constraint `appointment_no_overlap`
(`EXCLUDE USING gist`). O teste de integração do PR #13 confirmou a garantia: em 8.800 requisições
concorrentes, nenhuma vez duas linhas ocuparam o mesmo intervalo
(`docs/tcc/evidencias/rnf-03-dupla-reserva.md`).

**Fato.** O mesmo teste mostrou um defeito de resposta. Com 50 inserções simultâneas para o mesmo
profissional, o PostgreSQL abortou transações com `40P01 deadlock detected`, *"while checking exclusion
constraint"*, e outras estouraram o tempo de leitura de 30 s. As duas viraram 500, e em algumas rodadas
ninguém conseguiu um horário que estava livre. Em 27/10, antes desta decisão, 5 de 5 execuções do teste
de 20 rodadas reprovaram: em cada uma, uma rodada ficou presa cerca de 30 s e devolveu 49 ou 50 erros.

**Inferência (mecanismo).** Na checagem de uma constraint de exclusão, a transação que encontra uma linha
conflitante ainda não confirmada espera essa transação terminar. Com várias inserções conflitantes ao mesmo
tempo, as esperas formam ciclos: o PostgreSQL desfaz um deles com `40P01` e os outros esperam em fila.

**Fato.** A ADR-005 rejeitou lock distribuído em Redis. A rejeição foi da infraestrutura nova e do lock
fora da transação, não de ordenar a fila no banco.

## Problema

Como fazer a disputa pelo mesmo horário terminar sempre com um vencedor e respostas 409 para os demais,
sem tirar da constraint o papel de garantia?

## Alternativas consideradas

### A — Sem lock, com nova tentativa (`EnableRetryOnFailure` ou retry no comando)

**A favor:** nenhuma mudança na forma de gravar. A vítima do deadlock tenta de novo e, na segunda vez,
recebe `23P01` → 409.
**Contra:** a nova tentativa pode cair em deadlock de novo com 50 concorrentes, e as esperas de 30 s
continuam possíveis. O `EnableRetryOnFailure` exige envolver toda transação explícita numa
`ExecutionStrategy`. Trata o sintoma, não a fila.

### B — Lock distribuído fora do banco (Redis)

**A favor:** independe do banco.
**Contra:** já rejeitado na ADR-005. É infraestrutura nova e cria um lock que não é da mesma transação do
INSERT: se o processo cai entre o lock e o commit, o lock e o dado divergem.

### C — Fila por profissional na aplicação (canal ou semáforo em memória)

**A favor:** nenhuma dependência do banco além do INSERT.
**Contra:** vale só dentro de uma instância da API. Com duas instâncias, a fila se divide e o deadlock
volta.

### D — `pg_advisory_xact_lock` por profissional, na mesma transação do INSERT

**A favor:** a fila fica no banco, então vale para qualquer número de instâncias. O lock é da transação e
sai sozinho no commit ou no rollback; não existe lock esquecido. A constraint continua sendo quem recusa.
**Contra:** a criação de agendamento do mesmo profissional passa a ser serial; acopla a gravação ao
PostgreSQL.

## Decisão

Adotamos **D**.

- Todo `SaveChanges` que **adiciona** um agendamento em estado que ocupa horário (`Pending`, `Confirmed`,
  `Completed`, `NoShow`) abre a transação, se ainda não houver uma, e adquire
  `pg_advisory_xact_lock(chave do profissional)` **antes** do INSERT. Vale para o pedido do consumidor e para
  a marcação de balcão, porque os dois passam pelo mesmo `BookingDbContext.SaveChangesAsync`.
- A chave é de 64 bits, derivada do `professional_id` (as duas metades do `Guid` combinadas). Com mais de um
  profissional na mesma gravação, as chaves são adquiridas em ordem crescente.
- O SQL do lock mora só no `BookingDbContext`. Nenhum comando conhece o lock.
- A constraint `appointment_no_overlap` continua sendo a garantia. O lock só ordena quem chega à checagem.
- `40P01` e `55P03` passam a ser traduzidos para uma resposta que não é 500, como **defesa**, não como
  correção (ver `rnf-03-dupla-reserva.md`, "Depois da correção").

## Consequências

### O que fica mais fácil

- A disputa pelo mesmo profissional termina com um vencedor e 409 com alternativas para os demais, sem
  500 e sem rodada vazia.
- Vale para várias instâncias da API, porque a fila está no banco (inferência: não executado com várias).

### O que fica mais difícil

- **Enfileiramento.** Pedidos simultâneos para o mesmo profissional são atendidos um por vez no trecho do
  INSERT. A corrida de 50 ficou mais lenta (números em `rnf-03-dupla-reserva.md`).
- **Acoplamento ao PostgreSQL.** Trocar de banco exige outro mecanismo de fila.
- Cada gravação de agendamento ocupa uma conexão por mais tempo enquanto espera o lock; com picos muito
  maiores que 50, o pool de conexões vira o limite.
- O espaço de chaves de advisory lock é do banco inteiro. Outro uso futuro de advisory lock precisa evitar
  colisão com estas chaves.

### O que passa a ser proibido

- Tirar a constraint por confiar no lock. O lock não verifica sobreposição; ele só ordena.
- Criar agendamento que ocupa horário por um caminho que não passe pelo `BookingDbContext` (SQL direto)
  sem adquirir o mesmo lock.
- Adquirir locks de vários profissionais fora da ordem crescente.

## Premissa não verificada

**O lock vale com várias instâncias da API.** Inferência pelo mecanismo: o lock é do banco, não do
processo. Não executado: os testes usam um servidor de aplicação.

## Como saber que erramos

- Se o tempo da corrida de 50 passar a ser percebido como lentidão no pico real de uso.
- Se o pool de conexões esgotar em pico, com pedidos esperando o lock.
- Se `40P01` voltar a aparecer nos testes de 20 rodadas.

## Referências

- ADR-005 · `docs/tcc/evidencias/rnf-03-dupla-reserva.md`
- `backend/src/Infrastructure/Booking.Infrastructure/Persistence/Context/BookingDbContext.cs` — `SaveChangesAsync`, `SlotLockKeys`
- `backend/tests/Booking.IntegrationTests/Scheduling/DoubleBookingTests.cs` — A1, A2, A3
- `PROJECT-CONTEXT.md` §11 (pendência O)
