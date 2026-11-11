import {
  EMPTY_AGENDA_FILTERS,
  agendaPeriod,
  agendaSearch,
  daysOf,
  filterAgenda,
  readAgendaFilters,
  shiftPeriod,
  toRangeAppointment,
} from './filters'
import { describe, expect, it } from 'vitest'

import type { AppointmentResponse } from '@api/models'

const appointment = (fields: Partial<AppointmentResponse>): AppointmentResponse => ({
  id: 'a1',
  businessId: 'b1',
  professionalId: 'p1',
  serviceId: 's1',
  serviceName: 'Corte masculino',
  durationMinutes: 30,
  priceCents: 4_500,
  startsAt: '2026-11-03T12:00:00Z',
  endsAt: '2026-11-03T12:30:00Z',
  status: 'Confirmed',
  source: 'Online',
  expiresAt: null,
  attendeeName: null,
  customerNotes: null,
  cancellationReason: null,
  cancelledBy: null,
  requestedAt: '2026-11-01T12:00:00Z',
  customerName: 'Ana Ribeiro',
  ...fields,
})

describe('filtros da agenda na URL', () => {
  it('escreve só o que não é padrão e lê de volta', () => {
    const filters = {
      view: 'week' as const,
      professionalId: 'p2',
      status: 'Pending' as const,
      serviceId: 's1',
      query: 'ana',
    }

    expect(agendaSearch(EMPTY_AGENDA_FILTERS)).toBe('')
    expect(agendaSearch(filters)).toBe('view=week&pro=p2&status=Pending&service=s1&q=ana')
    expect(readAgendaFilters(new URLSearchParams(agendaSearch(filters)))).toEqual(filters)
  })

  it('valor que não existe vira o padrão, nunca erro', () => {
    expect(readAgendaFilters(new URLSearchParams('view=ano&status=Rejected'))).toEqual(
      EMPTY_AGENDA_FILTERS,
    )
  })
})

describe('filtrar a agenda', () => {
  const list = [
    appointment({ id: 'a1', customerName: 'Ana Ribeiro', status: 'Confirmed' }),
    appointment({
      id: 'a2',
      customerName: 'Bruno Teixeira',
      status: 'Pending',
      professionalId: 'p2',
    }),
    appointment({ id: 'a3', customerName: 'Carla Menezes', status: 'Completed', serviceId: 's2' }),
    appointment({ id: 'a4', customerName: 'Diego', status: 'Cancelled' }),
    appointment({ id: 'a5', customerName: null, attendeeName: 'Érica Balcão', status: 'NoShow' }),
  ]
  const ids = (filters: Partial<typeof EMPTY_AGENDA_FILTERS>) =>
    filterAgenda(list, { ...EMPTY_AGENDA_FILTERS, ...filters }).map(({ id }) => id)

  it('cancelado, recusado e expirado nunca entram: liberaram o horário', () => {
    expect(ids({})).toEqual(['a1', 'a2', 'a3', 'a5'])
  })

  it('por profissional, status, serviço e nome sem acento', () => {
    expect(ids({ professionalId: 'p2' })).toEqual(['a2'])
    expect(ids({ status: 'Completed' })).toEqual(['a3'])
    expect(ids({ serviceId: 's2' })).toEqual(['a3'])
    expect(ids({ query: 'erica' })).toEqual(['a5'])
    expect(ids({ query: 'RIBEIRO', status: 'Pending' })).toEqual([])
  })
})

describe('período da semana e do mês', () => {
  it('semana de segunda a domingo', () => {
    // 2026-11-04 é quarta.
    expect(agendaPeriod('week', '2026-11-04')).toEqual({ from: '2026-11-02', to: '2026-11-08' })
    expect(daysOf('2026-11-02', '2026-11-08')).toHaveLength(7)
  })

  it('mês na grade de segunda a domingo, dentro do limite de 42 dias da API', () => {
    const { from, to } = agendaPeriod('month', '2026-11-15')

    expect(from).toBe('2026-10-26')
    expect(to).toBe('2026-12-06')
    expect(daysOf(from, to).length).toBeLessThanOrEqual(42)
    expect(daysOf(from, to).length % 7).toBe(0)
  })

  it('anda uma semana ou um mês', () => {
    expect(shiftPeriod('week', '2026-11-04', 1)).toBe('2026-11-11')
    expect(shiftPeriod('month', '2026-11-15', -1)).toBe('2026-10-01')
    expect(shiftPeriod('month', '2026-12-15', 1)).toBe('2027-01-01')
  })

  it('o agendamento aparece no dia e na hora do fuso do estabelecimento', () => {
    // 02:30Z do dia 4 é 23:30 do dia 3 em São Paulo.
    const item = toRangeAppointment(
      appointment({ startsAt: '2026-11-04T02:30:00Z', endsAt: '2026-11-04T03:00:00Z' }),
      'America/Sao_Paulo',
      () => 'Marina',
    )

    expect(item).toMatchObject({
      date: '2026-11-03',
      start: '23:30',
      end: '00:00',
      professionalName: 'Marina',
    })
  })
})
