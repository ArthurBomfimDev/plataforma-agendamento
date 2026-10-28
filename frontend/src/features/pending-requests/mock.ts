import type { PendingRequest } from './types'

/**
 * Dados PROVISÓRIOS, copiados dos wireframes "10 · Painel — Pedidos pendentes" e "P03 · Painel
 * mobile — Pedidos pendentes" do Figma. Não são dado real. Saem quando existir a consulta de
 * pedidos do Business em `src/lib/api`.
 */

const minutesAgo = (now: Date, minutes: number) => new Date(now.getTime() - minutes * 60_000)

export const createMockPendingRequests = (now = new Date()): PendingRequest[] => [
  {
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
  },
  {
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
  },
  {
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
  },
]
