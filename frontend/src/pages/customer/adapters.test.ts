import { describe, expect, it } from 'vitest'
import { groupSlots, toCustomerAppointment } from './adapters'
import { safeRedirect } from '@router/paths'
import { readBookingSearch, readSentSearch } from './booking/booking-search'

import type { AppointmentResponse } from '@api/models'

describe('groupSlots', () => {
  it('converte o instante UTC para o fuso do estabelecimento antes de agrupar', () => {
    // 12:00Z = 09:00 em São Paulo; 21:00Z = 18:00, já é noite.
    const slots = groupSlots(
      ['2026-11-03T12:00:00Z', '2026-11-03T17:30:00Z', '2026-11-03T21:00:00Z'],
      'America/Sao_Paulo',
    )

    expect(slots.morning).toEqual([{ time: '09:00' }])
    expect(slots.afternoon).toEqual([{ time: '14:30' }])
    expect(slots.evening).toEqual([{ time: '18:00' }])
  })
})

describe('toCustomerAppointment', () => {
  const appointment: AppointmentResponse = {
    id: 'a1',
    businessId: 'b1',
    professionalId: 'p1',
    serviceId: 's1',
    serviceName: 'Corte masculino',
    durationMinutes: 30,
    priceCents: 4500,
    startsAt: '2026-11-03T12:00:00Z',
    endsAt: '2026-11-03T12:30:00Z',
    status: 'Rejected',
    source: 'Customer',
    expiresAt: null,
    attendeeName: null,
    customerNotes: null,
    cancellationReason: null,
    cancelledBy: null,
    requestedAt: '2026-11-01T12:00:00Z',
  }

  it('mostra dia e hora no fuso do estabelecimento', () => {
    const result = toCustomerAppointment(appointment, undefined, 'America/Sao_Paulo')

    expect(result.date).toBe('2026-11-03')
    expect(result.time).toBe('09:00')
  })

  it('leva recusado para "cancelado": o atendimento não acontece', () => {
    expect(toCustomerAppointment(appointment, undefined, 'America/Sao_Paulo').status).toBe(
      'cancelled',
    )
  })
})

describe('safeRedirect', () => {
  it('aceita só caminho interno', () => {
    expect(safeRedirect('/appointments')).toBe('/appointments')
    expect(safeRedirect('//evil.example')).toBeNull()
    expect(safeRedirect('https://evil.example')).toBeNull()
    expect(safeRedirect(null)).toBeNull()
  })
})

describe('readBookingSearch', () => {
  it('exige profissional e instante válidos', () => {
    const valid = readBookingSearch(
      new URLSearchParams('professional=p1&startsAt=2026-11-03T12:00:00Z'),
    )
    expect(valid?.professionalId).toBe('p1')

    expect(readBookingSearch(new URLSearchParams('startsAt=2026-11-03T12:00:00Z'))).toBeNull()
    expect(readBookingSearch(new URLSearchParams('professional=p1&startsAt=ontem'))).toBeNull()
  })
})

describe('readSentSearch', () => {
  it('exige o agendamento criado e o instante do envio', () => {
    expect(
      readSentSearch(new URLSearchParams('appointment=a1&sentAt=2026-11-03T12:00:00Z'))
        ?.appointmentId,
    ).toBe('a1')
    expect(readSentSearch(new URLSearchParams('sentAt=2026-11-03T12:00:00Z'))).toBeNull()
  })
})
