import type { PendingRequest } from './types'

/**
 * Dados SÓ DE TESTE, copiados dos wireframes "10 · Painel — Pedidos pendentes" e "P03 · Painel
 * mobile — Pedidos pendentes" do Figma. A tela recebe os pedidos da API (Onda 7A); isto alimenta só
 * os testes de componente. Não são dado real.
 */

/** Prazo de resposta dos wireframes. */
export const FIXTURE_EXPIRATION_HOURS = 12

const minutesAgo = (now: Date, minutes: number) => new Date(now.getTime() - minutes * 60_000)

const deadline = (requestedAt: Date) =>
  new Date(requestedAt.getTime() + FIXTURE_EXPIRATION_HOURS * 3_600_000)

const request = (fields: Omit<PendingRequest, 'expiresAt'>): PendingRequest => ({
  ...fields,
  expiresAt: deadline(fields.requestedAt),
})

export const createFixturePendingRequests = (now = new Date()): PendingRequest[] => [
  request({
    id: 'request-ana',
    customerName: 'Ana Ribeiro',
    customerHistory: null,
    serviceName: 'Corte masculino',
    durationMinutes: 30,
    priceCents: 4_500,
    date: '2026-09-11',
    start: '09:30',
    professionalName: 'Marina Souza',
    // "pedido há 14 min · expira em 11 h 46", como no wireframe.
    requestedAt: minutesAgo(now, 14),
    outsideWorkingHours: false,
  }),
  request({
    id: 'request-bruno',
    customerName: 'Bruno Teixeira',
    customerHistory: { appointments: 3, noShows: 0 },
    serviceName: 'Coloração',
    durationMinutes: 90,
    priceCents: 18_000,
    date: '2026-09-12',
    start: '14:00',
    professionalName: null,
    requestedAt: minutesAgo(now, 2 * 60),
    outsideWorkingHours: false,
  }),
  request({
    id: 'request-carla',
    customerName: 'Carla Menezes',
    customerHistory: { appointments: 3, noShows: 1 },
    serviceName: 'Corte + barba',
    durationMinutes: 60,
    priceCents: 8_000,
    date: '2026-09-14',
    start: '18:00',
    professionalName: 'Rafael Lima',
    requestedAt: minutesAgo(now, 5 * 60),
    outsideWorkingHours: true,
  }),
]
