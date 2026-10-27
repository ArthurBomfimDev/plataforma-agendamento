# ADR-017 — Intervalo bloqueado em colunas gravadas, não coluna gerada

- **Status:** Proposto
- **Data:** 2026-10-26
- **Decisores:** Arthur Bomfim, Rafael Ernandes
- **Módulos afetados:** Scheduling
- **Substitui:** —
- **Substituído por:** —
- **Complementa:** ADR-005

---

## Contexto

**Fato.** A ADR-005 decidiu prevenir dupla reserva com `EXCLUDE USING gist` sobre `professional_id` e o
intervalo bloqueado — o horário do atendimento acrescido dos buffers antes e depois.

**Fato.** A revisão de 22/09 (`docs/produto/decisoes-localizacao-notificacao-modelo.md` §1.1) definiu o
intervalo bloqueado como coluna gerada:

```sql
blocked_range tstzrange GENERATED ALWAYS AS (
  tstzrange(starts_at - make_interval(mins => buffer_before_minutes),
            ends_at   + make_interval(mins => buffer_after_minutes), '[)')
) STORED
```

**Fato.** O PostgreSQL só aceita em coluna gerada expressões `IMMUTABLE`. A subtração e a soma de
`interval` em `timestamptz` são `STABLE`, porque o resultado depende do fuso horário configurado na sessão.
O PostgreSQL recusa essa coluna.

**Fato.** `tstzrange(timestamptz, timestamptz, text)` é `IMMUTABLE` e pode compor o índice GiST de uma
constraint de exclusão.

**Fato, estado do código em 26/10.** A migration `20261014032556_AddCoreModules` implementou a alternativa
abaixo, com o motivo em comentário no próprio SQL. O domínio preenche os limites ao criar o agendamento
(`Appointment.BlockedStartsAt` e `BlockedEndsAt`), e a violação (`23P01`, `appointment_no_overlap`) é
traduzida em `BookingDbContext` para `appointment.slot_no_longer_available` → HTTP 409 com até 5 horários
alternativos.

## Problema

Como montar o intervalo bloqueado da constraint de exclusão, já que a coluna gerada planejada não pode ser
criada?

## Alternativas consideradas

### A — Coluna gerada com função própria marcada como `IMMUTABLE`

**A favor:** mantém o cálculo no banco, como planejado.
**Contra:** marcar como `IMMUTABLE` uma função que não é — o resultado depende do fuso da sessão — engana o
planejador e o índice. É uma garantia apoiada em uma declaração falsa.

### B — Calcular o intervalo dentro da própria constraint, a partir de `starts_at` e dos buffers

**A favor:** nenhuma coluna a mais.
**Contra:** a expressão da constraint teria a mesma aritmética `STABLE` de `timestamptz` com `interval`, e
expressão de índice também exige `IMMUTABLE`. Esbarra na mesma restrição.

### C — Colunas comuns gravadas pela aplicação, com check de coerência

**A favor:** o `tstzrange` montado só com duas colunas `timestamptz` é `IMMUTABLE`; o cálculo dos buffers
fica no domínio, que já tem o serviço e os buffers à mão; um check impede limite incoerente.
**Contra:** o cálculo sai do banco: um bug no domínio grava um intervalo menor do que o devido.

## Decisão

Adotamos **C**.

```sql
-- colunas gravadas pela aplicação
blocked_starts_at timestamptz NOT NULL,   -- início − buffer antes
blocked_ends_at   timestamptz NOT NULL,   -- início + duração + buffer depois

CONSTRAINT ck_appointment_blocked_range CHECK (blocked_starts_at <= starts_at AND blocked_ends_at >= ends_at)

ALTER TABLE scheduling.appointment
    ADD CONSTRAINT appointment_no_overlap
    EXCLUDE USING gist (
        professional_id WITH =,
        tstzrange(blocked_starts_at, blocked_ends_at, '[)') WITH &&
    ) WHERE (status IN ('Pending', 'Confirmed', 'Completed', 'NoShow'));
```

A garantia contra dupla reserva continua no banco, como decidido na ADR-005. O que muda é só onde se
calcula o intervalo.

## Consequências

### O que fica mais fácil

- A constraint existe e roda; a ADR-005 deixa de depender de um SQL que nunca executaria.
- O check torna impossível gravar um intervalo bloqueado que não contenha o atendimento.

### O que fica mais difícil

- O check garante que o intervalo **contém** o atendimento, não que tem o tamanho exato dos buffers. Um bug
  que grave buffer menor passa pelo check e deixa encaixar um atendimento colado demais.
- Mudar os buffers de um serviço não muda os agendamentos já gravados — o que, por ser snapshot, é o
  comportamento desejado.

### O que passa a ser proibido

- Gravar `blocked_starts_at`/`blocked_ends_at` fora da criação do agendamento no domínio.
- Renomear um `AppointmentStatus` sem migration: os nomes estão no `WHERE`, e a trava se desliga em silêncio.

## Premissa não verificada

**O cálculo do domínio está certo para todo serviço.** Verificado por teste unitário do domínio, não contra
a tabela real. O RNF-03 (zero dupla reserva sob 50 requisições concorrentes) ainda não tem teste de
integração: o CI roda só uma sonda SQL em tabela própria. Até esse teste existir, a garantia é do SQL
provado na sonda, não do endpoint.

## Como saber que erramos

- Se um teste de integração encontrar dois agendamentos sobrepostos do mesmo profissional em estados que
  ocupam o horário.
- Se aparecer agendamento com intervalo bloqueado menor que duração + buffers.

## Referências

- ADR-005 — constraint de exclusão
- `docs/produto/decisoes-localizacao-notificacao-modelo.md` §1.1 (com errata de 26/10)
- `backend/src/Infrastructure/Booking.Infrastructure/Persistence/Migrations/20261014032556_AddCoreModules.cs`
- `backend/src/Core/Booking.Domain/Entity/Module/Scheduling/Appointment.cs`
- `backend/src/Infrastructure/Booking.Infrastructure/Persistence/Context/BookingDbContext.cs`
- `.github/workflows/backend-ci.yml` — sonda de exclusão
