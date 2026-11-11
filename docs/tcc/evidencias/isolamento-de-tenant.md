# Evidência — isolamento entre estabelecimentos (multi-tenancy, ADR-003)

> **Registro de execução real.** Os resultados saem da saída de
> `backend/tests/Booking.IntegrationTests/Tenancy/TenantIsolationTests.cs`.

## 1. Ambiente

Mesmo ambiente e mesmas execuções de [`rnf-03-dupla-reserva.md`](rnf-03-dupla-reserva.md) §1: 2026-10-27,
local (Testcontainers, PostgreSQL 17.5 + PostGIS 3.5.2), .NET 10.0.12, código de `7722488`, um servidor de
aplicação. **Não executado no CI** até esta data.

Cada teste monta dois estabelecimentos (A e B), aprovados, cada um com dono, profissional, serviço, jornada e
um pedido pendente de um consumidor próprio. Nada é compartilhado entre testes.

## 2. O que cada teste faz e o que foi observado

Os 7 testes foram aprovados nas 8 execuções do projeto. A saída detalhada foi impressa em 6 delas, com os
mesmos valores em todas.

| # | Cenário | Esperado | Observado |
|---|---|---|---|
| B1 | Dono de A chama `confirm`, `reject`, `cancel`, `complete`, `no-show` no agendamento de B | 404, e B intacto | 404 `appointment.not_found` nas 5; o agendamento de B continua `Pending` |
| B2 | Dono de A lista a agenda do dia e os pendentes | Só A, contagem exata | agenda: 1 item, de A; pendentes: 1 item, de A |
| B3 | Dono de A edita serviço e profissional de B e exclui jornada de B, por id | 404, e B intacto | 404 `service.not_found`, 404 `professional.not_found`, 404 `work_schedule.not_found`; nada mudou em B |
| B4 | Dono de A marca balcão com serviço e profissional de B | Recusado, nada gravado em B | 404 `service.not_found`; B continua com 1 agendamento, A com 1 |
| B5 | Consumidor X cancela o agendamento do consumidor Y | Recusado | 404 `appointment.not_found`; o agendamento de Y continua `Pending` |
| B6 | Token de consumidor (sem `businessId`) em 6 rotas `businesses/current/*` | 403 `tenant.missing` | 403 `tenant.missing` nas 6 (agenda, pendentes, serviços, profissionais, jornadas, estabelecimento) |
| B7 | `businessId`/`business_id` de B forjado na query da agenda e no corpo do balcão | Ignorado | A agenda devolveu só itens de A; o balcão gravou em A; B continua com 1 agendamento |

## 3. Interpretação

- **O tenant vem do token.** Em nenhum cenário um id de B, no caminho, na query ou no corpo, levou a leitura ou
  escrita em B.
- **Id de outro tenant responde como inexistente (404), não como proibido (403).** Isso vale para transição,
  edição e balcão. Um 403 confirmaria que o id existe; o 404 não dá essa informação.
- O B5 confirma o mesmo para a conta global do consumidor: o `CancelMyAppointmentCommand` busca por
  `(id, customer_id)`, então o agendamento de outro consumidor não existe para quem pergunta.

## 4. Limitações

- O isolamento observado é o do **filtro global do EF Core** (`HasQueryFilter("Tenant", …)`) e dos comandos.
  **Não há RLS no banco** (ADR-003: depois do MVP); uma consulta SQL escrita à mão fora do EF não é coberta.
- Os testes não percorrem todas as rotas. Cobrem agendamento, serviço, profissional e jornada; exceções de
  jornada (`schedule-exceptions`) e política do estabelecimento não foram testadas cruzando tenants.
- B3 testa a exclusão de jornada porque **não existe endpoint de edição de jornada** — só `POST` e `DELETE`.
- Papel `Professional` (acesso só à própria agenda) não foi testado aqui; todos os casos usam o `Owner`.
- Um único servidor de aplicação, banco local em contêiner, sem CI.
