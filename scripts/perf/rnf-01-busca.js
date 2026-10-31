// RNF-01 — busca com horários, p95 ≤ 800 ms, sobre os 30 estabelecimentos do seed de demonstração.
//
// A sequência medida é a que a tela precisa para mostrar um card com horários: a busca, e, para cada
// estabelecimento da primeira página, os profissionais (rota pública) e a disponibilidade do dia do serviço
// em destaque com cada profissional — em paralelo, como o app faz na página do estabelecimento
// (useAvailabilityCalendars). Em 27/10 a tela de resultados ainda usa mock: este cenário mede o que ela vai
// precisar, não uma tela que já existe.
//
//   docker run --rm --network <rede-do-compose> -v "$PWD/scripts/perf:/perf" -e BASE_URL=http://api:8080 \
//     grafana/k6:<versão> run /perf/rnf-01-busca.js
//
// Variáveis: BASE_URL, LAT, LON (padrão: centro de Garça-SP), RADIUS_KM, PAGE_SIZE, VUS, DURATION, DATE.

import http from 'k6/http'
import { check } from 'k6'
import { Trend, Rate } from 'k6/metrics'

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8081'
const LAT = __ENV.LAT || '-22.2125'
const LON = __ENV.LON || '-49.6564'
const RADIUS_KM = __ENV.RADIUS_KM || '5'
const PAGE_SIZE = __ENV.PAGE_SIZE || '10'
const DATE = __ENV.DATE || new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)

const sequence = new Trend('busca_com_horarios', true)
const searchOnly = new Trend('so_busca', true)
const failures = new Rate('falhas')

export const options = {
  scenarios: {
    busca: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: Number(__ENV.VUS || 10) },
        { duration: __ENV.DURATION || '60s', target: Number(__ENV.VUS || 10) },
      ],
    },
  },
  thresholds: {
    busca_com_horarios: ['p(95)<=800'],
    falhas: ['rate<0.01'],
  },
  summaryTrendStats: ['min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max', 'count'],
}

export default function () {
  const started = Date.now()

  const search = http.get(
    `${BASE_URL}/api/businesses/search?latitude=${LAT}&longitude=${LON}&radiusKm=${RADIUS_KM}&pageSize=${PAGE_SIZE}`,
    { tags: { etapa: 'busca' } },
  )
  searchOnly.add(search.timings.duration)
  const ok = check(search, { 'busca 200': (r) => r.status === 200 })
  failures.add(!ok)
  if (!ok) return

  const items = search.json('items')

  const professionals = http.batch(
    items.map((b) => ['GET', `${BASE_URL}/api/businesses/${b.id}/professionals?pageSize=50`, null, { tags: { etapa: 'profissionais' } }]),
  )

  const slotRequests = []
  items.forEach((b, i) => {
    const response = professionals[i]
    failures.add(response.status !== 200)
    if (response.status !== 200 || !b.serviceId) return
    for (const p of response.json('items')) {
      slotRequests.push([
        'GET',
        `${BASE_URL}/api/businesses/${b.id}/availability?serviceId=${b.serviceId}&professionalId=${p.id}&date=${DATE}`,
        null,
        { tags: { etapa: 'disponibilidade' } },
      ])
    }
  })

  // Profissional que não faz o serviço em destaque responde 404 (service.not_found): não é falha do cenário.
  for (const r of http.batch(slotRequests)) {
    failures.add(r.status !== 200 && r.status !== 404)
  }

  sequence.add(Date.now() - started)
}
