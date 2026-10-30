import type { AgendaDay } from './types'

/**
 * Dados SÓ DE TESTE, copiados dos wireframes "09 · Painel — Agenda do dia" e "P01 · Painel
 * mobile — Agenda do dia" do Figma. A tela recebe a agenda da API (Onda 7A); isto alimenta só os
 * testes de componente. Não são dado real.
 *
 * Onde os dois frames divergem, vale o do celular (P01), que tem duração e consumidor de cada item.
 */

export const FIXTURE_BUSINESS_NAME = 'Estúdio Duartina'

/** O "hoje" dos wireframes. */
export const FIXTURE_AGENDA_DATE = '2026-09-11'

const hoursFrom = (now: Date, hours: number) => new Date(now.getTime() + hours * 3_600_000)

export const createFixtureAgendaDay = (now = new Date()): AgendaDay => ({
  date: FIXTURE_AGENDA_DATE,
  summary: {
    appointmentsCount: 7,
    confirmedCount: 5,
    pendingCount: 2,
    expectedRevenueCents: 124_000,
  },
  professionals: [
    {
      id: 'marina-souza',
      name: 'Marina Souza',
      workStart: '09:00',
      workEnd: '15:00',
      pendingRequests: 2,
      entries: [
        {
          kind: 'appointment',
          id: 'apt-marina-1',
          start: '09:00',
          durationMinutes: 30,
          serviceName: 'Corte masculino',
          customerName: 'Ana Ribeiro',
          status: 'confirmed',
        },
        {
          kind: 'appointment',
          id: 'apt-marina-2',
          start: '10:30',
          durationMinutes: 20,
          serviceName: 'Barba',
          customerName: 'Bruno Teixeira',
          status: 'confirmed',
        },
        {
          kind: 'block',
          id: 'block-marina-lunch',
          start: '13:00',
          durationMinutes: 60,
          label: 'Almoço',
          detail: 'Bloqueio recorrente',
        },
        {
          kind: 'appointment',
          id: 'apt-marina-3',
          start: '14:00',
          durationMinutes: 60,
          serviceName: 'Corte + barba',
          customerName: 'Carla Menezes',
          status: 'pending',
          // "expira em 7 h", como no wireframe.
          expiresAt: hoursFrom(now, 7),
        },
      ],
    },
    {
      id: 'rafael-lima',
      name: 'Rafael Lima',
      workStart: '09:00',
      workEnd: '15:00',
      pendingRequests: 1,
      entries: [
        {
          kind: 'appointment',
          id: 'apt-rafael-1',
          start: '09:30',
          durationMinutes: 45,
          serviceName: 'Corte feminino',
          customerName: 'Ana Ribeiro',
          status: 'confirmed',
        },
        {
          kind: 'appointment',
          id: 'apt-rafael-2',
          start: '11:00',
          durationMinutes: 90,
          serviceName: 'Coloração',
          customerName: 'Bruno Teixeira',
          status: 'confirmed',
        },
        {
          kind: 'block',
          id: 'block-rafael-lunch',
          start: '13:00',
          durationMinutes: 60,
          label: 'Almoço',
          detail: 'Bloqueio recorrente',
        },
      ],
    },
    {
      id: 'carla-nunes',
      name: 'Carla Nunes',
      workStart: '09:00',
      workEnd: '16:00',
      pendingRequests: 1,
      entries: [
        {
          kind: 'appointment',
          id: 'apt-carla-1',
          start: '10:00',
          durationMinutes: 30,
          serviceName: 'Corte masculino',
          // TODO(figma): o wireframe não mostra quem pediu; nome provisório.
          customerName: 'Lucas Pereira',
          status: 'pending',
          expiresAt: hoursFrom(now, 10),
        },
        {
          kind: 'block',
          id: 'block-carla-day-off',
          start: '12:00',
          durationMinutes: 60,
          label: 'Folga',
        },
        {
          kind: 'appointment',
          id: 'apt-carla-2',
          start: '15:00',
          durationMinutes: 20,
          serviceName: 'Barba',
          customerName: 'Diego Alves',
          status: 'confirmed',
        },
      ],
    },
  ],
})
