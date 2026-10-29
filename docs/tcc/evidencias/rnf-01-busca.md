# Evidência — RNF-01: busca com horários, p95 ≤ 800 ms, 30 estabelecimentos

> **Registro de execução real.** Os números saem do resumo do k6 de uma execução em 27/10/2026. Onde algo
> não foi medido, está escrito.

## 1. Ambiente

| Item | Valor |
|---|---|
| Data | 2026-10-27 |
| Código da API | `2600e15` (`feat/integracao-front-back` depois das Ondas 1 e 2). Scripts de seed e de carga da branch `feat/seed-e-desempenho` |
| Máquina | Intel Core i5-10400F (6 núcleos, 12 threads), 31,9 GB de RAM, Windows 11 Pro 10.0.26200 |
| Docker | Docker Desktop, engine 29.9.2; VM com 12 CPUs e ~15,6 GB |
| API | `docker compose` (imagem `runtime` do `backend/Dockerfile`), .NET 10, `ASPNETCORE_ENVIRONMENT=Development`, uma instância |
| Banco | `postgis/postgis:17-3.5` no mesmo Compose, sem ajuste de configuração |
| Gerador de carga | `grafana/k6:1.0.0`, **na mesma máquina**, na rede do Compose (`http://api:8080`) |
| Dados | `bun scripts/seed-demo.ts --historico` num banco novo: 30 estabelecimentos ativos (26 Beleza, 4 Saúde), 122 profissionais, 81 serviços, 37.119 agendamentos (60 dias de passado e 14 de futuro) |

## 2. O que o cenário faz

`scripts/perf/rnf-01-busca.js`. Cada iteração é a sequência que a tela precisa para mostrar os cards com horários:

1. `GET /api/businesses/search` no centro de Garça-SP, raio de 5 km, 10 por página — os 30 estabelecimentos
   estão no raio, a página traz 10;
2. para cada um dos 10, `GET /api/businesses/{id}/professionals` (em paralelo, `http.batch`);
3. para cada profissional, `GET /api/businesses/{id}/availability` do serviço em destaque da busca, no dia
   seguinte (28/10), em paralelo.

São cerca de 51 requisições por iteração. A métrica do limite (`busca_com_horarios`) é o tempo da sequência
inteira, do início da busca à última resposta de horários.

⚠️ **A tela de resultados ainda usa mock** (`frontend/src/features/search-results/mock.ts`). O cenário mede o
que ela vai precisar, no padrão que o app já usa na página do estabelecimento (`useAvailabilityCalendars`:
um pedido de disponibilidade por profissional, em paralelo) — não uma tela que já existe.

Carga: 10 usuários virtuais (rampa de 10 s e 60 s sustentados), sem pausa entre iterações.

## 3. Resultado — evidência

| Métrica | mín | mediana | p90 | p95 | p99 | máx | amostras |
|---|---|---|---|---|---|---|---|
| **Sequência busca + horários** | 53 ms | 245 ms | 276 ms | **292 ms** | 335 ms | 414 ms | 2.662 iterações |
| Só a busca | 3,5 ms | 16,8 ms | 24,9 ms | 27,7 ms | 37,5 ms | 74,4 ms | 2.662 |
| Toda requisição HTTP | 1,5 ms | 24,7 ms | 35,6 ms | 39,4 ms | 48,8 ms | 108 ms | 135.762 |

- Vazão: 1.936 requisições/s, 38 sequências/s.
- Taxa de erro: **0,00%** (0 de 135.762). Uma resposta 404 de disponibilidade (profissional que não faz o
  serviço) não contaria como erro; no seed todo profissional faz todos os serviços do estabelecimento.
- Limite do k6: `p(95)<=800` — **aprovado** (292 ms).

## 4. Interpretação

- Nas condições medidas, a sequência completa ficou em **292 ms no p95**, cerca de 37% do limite de 800 ms.
- A busca em si é pequena no total (p95 de 28 ms). O custo está nas ~40 consultas de disponibilidade da
  página: é a primeira coisa a cortar se o limite apertar (pré-calcular, ou pedir horários só dos cards visíveis).
- Não houve investigação de consulta, índice ou N+1, porque o limite passou com folga.

## 5. Limitações

- **Uma máquina**: k6, API e banco disputam a mesma CPU. A latência de rede entre eles é a da rede virtual do
  Docker, não a de uma hospedagem real.
- Banco em contêiner local, com a configuração padrão da imagem e dados aquecidos em cache após o seed.
- 30 estabelecimentos numa cidade; não diz nada sobre milhares.
- 10 usuários virtuais sem pausa; não é um perfil de uso medido, é uma carga constante escolhida.
- Ambiente `Development` da API (logging e tratamento de erro de desenvolvimento).
- Uma execução de 70 s; não mede variação entre execuções.

## 6. Como reproduzir

```bash
COMPOSE_PROJECT_NAME=booking-seedcheck docker compose up --build -d db migrations api
API_URL=http://127.0.0.1:8181 bun scripts/seed-demo.ts --historico
docker run --rm --network booking-seedcheck_default -v "$PWD/scripts/perf:/perf" \
  -e BASE_URL=http://api:8080 -e DATE=2026-10-28 grafana/k6:1.0.0 run /perf/rnf-01-busca.js
```

(com `DB_PORT=5543 API_PORT=8181 WEB_PORT=8180` para não colidir com a pilha local `booking`)
