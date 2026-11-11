# Evidência — RNF-02: cálculo de disponibilidade, p95 ≤ 200 ms

> **Registro de execução real.** Os números saem do resumo do k6 de uma execução em 27/10/2026.

## 1. Ambiente

Mesmo de [`rnf-01-busca.md`](rnf-01-busca.md) §1: 2026-10-27, API em `2600e15`, i5-10400F, 31,9 GB, Docker
Desktop 29.9.2, `postgis/postgis:17-3.5`, `grafana/k6:1.0.0` na mesma máquina, banco do seed com histórico
(37.119 agendamentos).

## 2. O que o cenário faz

`scripts/perf/rnf-02-disponibilidade.js`. Um profissional fixo, o **mais ocupado do seed**: escolhido por SQL
antes da execução, com 67 agendamentos `Pending`/`Confirmed` nos 14 dias seguintes. Nos dias medidos ele tinha
de 5 a 13 agendamentos por dia (28/10: 11; 29/10: 13; 30/10: 12; 03/11: 6; 04/11: 8; 05/11: 5).

Cada iteração faz duas requisições:

1. `GET /api/businesses/{id}/availability` — os horários de um dia, sorteado entre 29/10, 30/10, 03/11,
   04/11 e 05/11. Conferido à mão: em 29/10 a resposta traz 4 horários livres (o cálculo é feito, não é
   lista vazia);
2. `GET /api/businesses/{id}/availability/calendar` — 14 dias (28/10 a 10/11), 10 deles com jornada.

O serviço é o mais curto do profissional (o de mais horários candidatos). Carga: 10 usuários virtuais
(rampa de 10 s e 60 s sustentados), sem pausa.

## 3. Resultado — evidência

| Rota | mín | mediana | p90 | p95 | p99 | máx | amostras |
|---|---|---|---|---|---|---|---|
| **Dia** (`availability`) | 4,6 ms | 8,4 ms | 11,2 ms | **12,3 ms** | 14,9 ms | 24,3 ms | 11.426 |
| **Calendário de 14 dias** | 27,1 ms | 46,9 ms | 54,2 ms | **57,6 ms** | 67,0 ms | 89,5 ms | 11.426 |

- Vazão: 326 requisições/s. Taxa de erro: **0,00%** (0 de 22.852).
- Limites do k6: `p(95)<=200` nas duas rotas — **aprovados**.

## 4. Interpretação

- O cálculo de um dia ficou em 12 ms no p95; o de 14 dias, em 58 ms — os dois bem abaixo de 200 ms, com o
  profissional mais carregado do seed.
- O calendário custou cerca de 5 vezes o dia, para 14 dias. **Hipótese, não verificada:** o custo cresce mais
  com o número de dias do que com a carga de agendamentos — nenhuma execução variou uma coisa sem a outra.
- A ADR-006 (slot calculado, não persistido) se sustenta nestas condições.

## 5. Limitações

- As mesmas da [`rnf-01-busca.md`](rnf-01-busca.md) §5: uma máquina, banco em contêiner local, carga constante
  escolhida, ambiente `Development`, uma execução.
- Um profissional. Não mede o pior caso teórico (agenda cheia o dia todo, muitos bloqueios, buffers longos).
- O profissional foi escolhido pelo número de agendamentos futuros; o histórico passado não entra no cálculo.

## 6. Como reproduzir

O profissional mais ocupado, pelo banco do seed:

```sql
SELECT business_id, professional_id, count(*) FROM scheduling.appointment
WHERE status IN ('Pending','Confirmed') AND starts_at > now()
GROUP BY 1, 2 ORDER BY 3 DESC LIMIT 1;
```

```bash
docker run --rm --network booking-seedcheck_default -v "$PWD/scripts/perf:/perf" -e BASE_URL=http://api:8080 \
  -e BUSINESS_ID=… -e SERVICE_ID=… -e PROFESSIONAL_ID=… -e DATES=… -e FROM=… -e TO=… \
  grafana/k6:1.0.0 run /perf/rnf-02-disponibilidade.js
```
