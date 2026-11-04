import { describe, expect, it } from 'vitest'
import { groupSlots, toCustomerAppointment } from './adapters'
import { safeRedirect } from '@router/paths'
import { readBookingSearch, readSentSearch } from './booking/booking-search'

import type { AppointmentResponse, MyReviewResponse, PublicBusinessResponse } from '@api/models'

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

  describe('avaliação (ADR-032)', () => {
    const completed: AppointmentResponse = { ...appointment, status: 'Completed' }
    const endsAt = new Date(completed.endsAt).getTime()
    const day = 24 * 60 * 60 * 1000
    const reviewOf = (appointmentId: string): MyReviewResponse => ({
      id: 'r1',
      appointmentId,
      businessId: 'b1',
      professionalId: 'p1',
      rating: 5,
      professionalRating: null,
      comment: null,
      serviceName: null,
      reviewedAt: '2026-11-04T12:00:00Z',
      editedAt: null,
      canEdit: true,
    })

    it('concluído, sem avaliação e dentro de 30 dias é avaliável', () => {
      const result = toCustomerAppointment(
        completed,
        undefined,
        'America/Sao_Paulo',
        null,
        new Date(endsAt + day),
      )

      expect(result.reviewable).toBe(true)
      expect(result.review).toBeNull()
    })

    it('a janela fecha 30 dias depois do fim do atendimento', () => {
      const lastDay = toCustomerAppointment(
        completed,
        undefined,
        'America/Sao_Paulo',
        null,
        new Date(endsAt + 30 * day),
      )
      const after = toCustomerAppointment(
        completed,
        undefined,
        'America/Sao_Paulo',
        null,
        new Date(endsAt + 30 * day + 1),
      )

      expect(lastDay.reviewable).toBe(true)
      expect(after.reviewable).toBe(false)
    })

    it('já avaliado deixa de ser avaliável e leva a avaliação junto', () => {
      const review = reviewOf(completed.id)
      const result = toCustomerAppointment(
        completed,
        undefined,
        'America/Sao_Paulo',
        review,
        new Date(endsAt + day),
      )

      expect(result.reviewable).toBe(false)
      expect(result.review).toBe(review)
    })

    it('só o concluído é avaliável', () => {
      const confirmed = toCustomerAppointment(
        { ...appointment, status: 'Confirmed' },
        undefined,
        'America/Sao_Paulo',
        null,
        new Date(endsAt + day),
      )

      expect(confirmed.reviewable).toBe(false)
    })

    it('em estabelecimento de Saúde marca o atendimento como sensível', () => {
      const health = { category: 'Saude', address: {} } as PublicBusinessResponse
      const beauty = { category: 'Beleza', address: {} } as PublicBusinessResponse

      expect(toCustomerAppointment(completed, health, 'America/Sao_Paulo').sensitive).toBe(true)
      expect(toCustomerAppointment(completed, beauty, 'America/Sao_Paulo').sensitive).toBe(false)
    })
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
