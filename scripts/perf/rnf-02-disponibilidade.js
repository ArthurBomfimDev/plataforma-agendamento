// RNF-02 — cálculo de disponibilidade, p95 ≤ 200 ms, com profissional carregado de agendamentos.
//
// Mede as duas rotas públicas de disponibilidade para UM profissional (o mais ocupado do seed, escolhido por
// SQL antes da execução e passado por variável): o dia (`availability`) e o calendário de 14 dias
// (`availability/calendar`). Cada requisição é uma medida; o limite vale para cada rota.
//
//   docker run --rm --network <rede-do-compose> -v "$PWD/scripts/perf:/perf" -e BASE_URL=http://api:8080 \
//     -e BUSINESS_ID=… -e SERVICE_ID=… -e PROFESSIONAL_ID=… -e DATES=2026-10-28,2026-10-29 \
//     grafana/k6:<versão> run /perf/rnf-02-disponibilidade.js
//
// Variáveis: BASE_URL, BUSINESS_ID, SERVICE_ID, PROFESSIONAL_ID, DATES (dias com agendamento), FROM, TO, VUS, DURATION.

import http from 'k6/http'
import { check } from 'k6'
import { Trend, Rate } from 'k6/metrics'

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8081'
const BUSINESS = __ENV.BUSINESS_ID
const SERVICE = __ENV.SERVICE_ID
const PROFESSIONAL = __ENV.PROFESSIONAL_ID
const DATES = (__ENV.DATES || '').split(',').filter(Boolean)
const FROM = __ENV.FROM
const TO = __ENV.TO

const day = new Trend('disponibilidade_dia', true)
const calendar = new Trend('disponibilidade_calendario', true)
const failures = new Rate('falhas')

export const options = {
  scenarios: {
    disponibilidade: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: Number(__ENV.VUS || 10) },
        { duration: __ENV.DURATION || '60s', target: Number(__ENV.VUS || 10) },
      ],
    },
  },
  thresholds: {
    disponibilidade_dia: ['p(95)<=200'],
    disponibilidade_calendario: ['p(95)<=200'],
    falhas: ['rate<0.01'],
  },
  summaryTrendStats: ['min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max', 'count'],
}

export function setup() {
  if (!BUSINESS || !SERVICE || !PROFESSIONAL || DATES.length === 0 || !FROM || !TO) {
    throw new Error('Defina BUSINESS_ID, SERVICE_ID, PROFESSIONAL_ID, DATES, FROM e TO.')
  }
}

export default function () {
  const base = `${BASE_URL}/api/businesses/${BUSINESS}/availability`
  const date = DATES[Math.floor(Math.random() * DATES.length)]

  const d = http.get(`${base}?serviceId=${SERVICE}&professionalId=${PROFESSIONAL}&date=${date}`, { tags: { rota: 'dia' } })
  day.add(d.timings.duration)
  failures.add(!check(d, { 'dia 200': (r) => r.status === 200 }))

  const c = http.get(`${base}/calendar?serviceId=${SERVICE}&professionalId=${PROFESSIONAL}&from=${FROM}&to=${TO}`, { tags: { rota: 'calendario' } })
  calendar.add(c.timings.duration)
  failures.add(!check(c, { 'calendário 200': (r) => r.status === 200 }))
}
