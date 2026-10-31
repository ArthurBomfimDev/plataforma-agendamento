import type { AppointmentResponse, ProfessionalResponse, WorkScheduleResponse } from '@api/models'
import { describe, expect, it } from 'vitest'
import { toAgendaDay, toPendingRequest, workHoursOn } from './adapters'

import { ApiError } from '@api/base'
import { instantIn } from '@utils/time-zone'
import { panelAccess } from '@layouts/panel-layout/guard'
import { performPanelAction } from '@layouts/panel-layout/actions'

const TZ = 'America/Sao_Paulo'

const professional = (id: string, displayName: string): ProfessionalResponse => ({
  id,
  displayName,
  specialty: null,
  bio: null,
  isActive: true,
  isPubliclyVisible: false,
  hasPublicProfileConsent: false,
  membershipId: null,
  photo: null,
})

const appointment = (fields: Partial<AppointmentResponse>): AppointmentResponse => ({
  id: 'a1',
  businessId: 'b1',
  professionalId: 'p1',
  serviceId: 's1',
  serviceName: 'Corte masculino',
  durationMinutes: 30,
  priceCents: 4_500,
  // 12:00Z = 09:00 em São Paulo.
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

// 03/11/2026 é terça (dayOfWeek 2).
const tuesday = (professionalId: string, start: string, end: string): WorkScheduleResponse => ({
  id: `${professionalId}-${start}`,
  professionalId,
  dayOfWeek: 2,
  startTime: `${start}:00`,
  endTime: `${end}:00`,
  effectiveFrom: '2026-01-01',
  effectiveTo: null,
})

describe('panelAccess (guard de /panel)', () => {
  const context = { businessId: 'b1', businessName: 'Estúdio Duartina', role: 'Owner' as const }

  it('sem sessão manda entrar; como consumidor, escolher o contexto; no painel, entra', () => {
    expect(panelAccess(false, null)).toBe('sign-in')
    expect(panelAccess(true, null)).toBe('choose-context')
    expect(panelAccess(true, context)).toBe('allowed')
    // Saiu pelo menu: a Home, não "Entrar" com o painel no `redirect`.
    expect(panelAccess(false, null, true)).toBe('home')
  })
})

describe('workHoursOn', () => {
  it('usa a regra do dia da semana em vigor, da primeira entrada à última saída', () => {
    const rules = [
      tuesday('p1', '09:00', '12:00'),
      tuesday('p1', '14:00', '18:00'),
      { ...tuesday('p1', '06:00', '22:00'), effectiveTo: '2026-10-31' },
    ]

    expect(workHoursOn(rules, '2026-11-03')).toEqual({ start: '09:00', end: '18:00' })
    expect(workHoursOn(rules, '2026-11-04')).toBeNull()
  })
})

describe('toAgendaDay', () => {
  const input = {
    date: '2026-11-03',
    timeZone: TZ,
    professionals: [professional('p1', 'Marina Souza'), professional('p2', 'Rafael Lima')],
    schedules: new Map([
      ['p1', [tuesday('p1', '09:00', '15:00')]],
      ['p2', [tuesday('p2', '10:00', '16:00')]],
    ]),
    pending: [] as AppointmentResponse[],
    onlyWithItems: false,
  }

  it('põe cada agendamento na coluna do profissional, no fuso do estabelecimento', () => {
    const day = toAgendaDay({
      ...input,
      appointments: [
        appointment({ id: 'a1' }),
        appointment({
          id: 'a2',
          professionalId: 'p2',
          status: 'Pending',
          startsAt: '2026-11-03T14:00:00Z',
          endsAt: '2026-11-03T15:00:00Z',
          expiresAt: '2026-11-03T20:00:00Z',
          customerName: null,
          attendeeName: 'Cliente do Balcão',
        }),
      ],
    })

    const [marina, rafael] = day.professionals
    expect(marina?.workStart).toBe('09:00')
    expect(marina?.entries[0]).toMatchObject({ start: '09:00', status: 'confirmed' })
    expect(rafael?.entries[0]).toMatchObject({
      start: '11:00',
      durationMinutes: 60,
      status: 'pending',
      customerName: 'Cliente do Balcão',
    })
    expect(rafael?.entries[0]?.kind === 'appointment' && rafael.entries[0].expiresAt).toEqual(
      new Date('2026-11-03T20:00:00Z'),
    )
    expect(day.summary).toEqual({
      appointmentsCount: 2,
      confirmedCount: 1,
      pendingCount: 1,
      expectedRevenueCents: 9_000,
    })
  })

  it('recusado, expirado e cancelado saem da agenda; concluído e falta ficam', () => {
    const day = toAgendaDay({
      ...input,
      appointments: [
        appointment({ id: 'r', status: 'Rejected' }),
        appointment({ id: 'e', status: 'Expired' }),
        appointment({ id: 'c', status: 'Cancelled' }),
        appointment({ id: 'ok', status: 'Completed' }),
        appointment({
          id: 'ns',
          status: 'NoShow',
          startsAt: '2026-11-03T13:00:00Z',
          endsAt: '2026-11-03T13:30:00Z',
        }),
      ],
    })

    expect(day.professionals[0]?.entries.map(({ id }) => id)).toEqual(['ok', 'ns'])
    expect(day.summary.appointmentsCount).toBe(2)
  })

  it('para o profissional, mostra só quem tem item no dia', () => {
    const day = toAgendaDay({ ...input, onlyWithItems: true, appointments: [appointment({})] })

    expect(day.professionals.map(({ id }) => id)).toEqual(['p1'])
  })
})

describe('toPendingRequest', () => {
  it('usa o prazo da API, o nome do profissional e marca fora do horário só com jornada conhecida', () => {
    const pending = appointment({
      status: 'Pending',
      // 21:00Z = 18:00, depois das 15:00 da jornada.
      startsAt: '2026-11-03T21:00:00Z',
      endsAt: '2026-11-03T22:00:00Z',
      expiresAt: '2026-11-02T00:00:00Z',
    })
    const context = {
      timeZone: TZ,
      professionalName: (id: string) => (id === 'p1' ? 'Marina Souza' : null),
      schedules: new Map([['p1', [tuesday('p1', '09:00', '15:00')]]]),
    }

    const request = toPendingRequest(pending, context)
    expect(request).toMatchObject({
      customerName: 'Ana Ribeiro',
      date: '2026-11-03',
      start: '18:00',
      durationMinutes: 60,
      professionalName: 'Marina Souza',
      outsideWorkingHours: true,
      customerHistory: undefined,
    })
    expect(request.expiresAt).toEqual(new Date('2026-11-02T00:00:00Z'))

    expect(
      toPendingRequest(pending, { ...context, schedules: new Map() }).outsideWorkingHours,
    ).toBe(false)
  })
})

describe('performPanelAction', () => {
  const notifier = () => {
    const messages: string[] = []
    return { messages, error: (message: string) => void messages.push(message) }
  }

  it('deu certo: true, sem mensagem de erro', async () => {
    const notify = notifier()

    expect(await performPanelAction(async () => ({}), notify)).toBe(true)
    expect(notify.messages).toEqual([])
  })

  it('409 de pedido já respondido: false e a mensagem em português', async () => {
    const notify = notifier()
    const conflict = new ApiError(409, 'appointment.cannot_confirm_from_current_status')

    expect(await performPanelAction(async () => Promise.reject(conflict), notify)).toBe(false)
    expect(notify.messages).toEqual(['Este pedido já foi respondido. A lista foi atualizada.'])
  })

  it('403, 404 e rede viram mensagens claras', async () => {
    const notify = notifier()

    await performPanelAction(
      async () => Promise.reject(new ApiError(403, 'auth.forbidden')),
      notify,
    )
    await performPanelAction(
      async () => Promise.reject(new ApiError(404, 'appointment.not_found')),
      notify,
    )
    await performPanelAction(async () => Promise.reject(new ApiError(0, undefined)), notify)

    expect(notify.messages).toEqual([
      'Você não tem permissão para fazer isso neste estabelecimento.',
      'Agendamento não encontrado.',
      'Sem conexão com o servidor. Tente de novo.',
    ])
  })
})

describe('instantIn (marcação de balcão)', () => {
  it('lê o horário no relógio do estabelecimento, não no do navegador', () => {
    expect(instantIn('2026-11-03', '09:00', TZ)).toBe('2026-11-03T12:00:00.000Z')
    expect(instantIn('2026-11-03', '09:00', 'Europe/Lisbon')).toBe('2026-11-03T09:00:00.000Z')
  })
})
