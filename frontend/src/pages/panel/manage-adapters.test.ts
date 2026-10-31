import { ROUTES, canManageBusiness, editServicePath, panelSectionOf } from '@router/paths'
import type { ServiceResponse, WorkScheduleResponse } from '@api/models'
import { describe, expect, it } from 'vitest'
import {
  exceptionPeriod,
  isSensitiveCategory,
  previewHoursOf,
  professionalChanges,
  scheduledChanges,
  toExceptionItem,
  toSaveServiceRequest,
  toScheduleRequest,
  toScheduleRow,
  toServiceListItem,
  toTeamMember,
  toWeekSchedule,
  weekChanges,
  withActive,
} from './manage-adapters'
import { applyRanges, toggleDay } from './schedules/screen/consts'

import { ApiError, errorMessage } from '@api/base'

const TZ = 'America/Sao_Paulo'

const service: ServiceResponse = {
  id: 's1',
  name: 'Corte',
  description: null,
  durationMinutes: 30,
  bufferBeforeMinutes: 5,
  bufferAfterMinutes: 10,
  slotStepMinutes: 15,
  priceCents: 4_500,
  suppliesNote: 'Navalha descartável',
  isActive: true,
  professionals: [
    { professionalId: 'p1', priceCents: 4_500, durationMinutes: 30, hasOverride: false },
  ],
}

const schedule = (fields: Partial<WorkScheduleResponse>): WorkScheduleResponse => ({
  id: 'w1',
  professionalId: 'p1',
  dayOfWeek: 1,
  startTime: '09:00:00',
  endTime: '18:00:00',
  effectiveFrom: '2026-01-01',
  effectiveTo: null,
  ...fields,
})

describe('seções do painel', () => {
  it('reconhece a seção pelo endereço, contando subpáginas', () => {
    expect(panelSectionOf(ROUTES.panel)).toBe('agenda')
    expect(panelSectionOf(ROUTES.panelRequests)).toBe('requests')
    expect(panelSectionOf(ROUTES.panelServices)).toBe('services')
    expect(panelSectionOf(ROUTES.panelNewService)).toBe('services')
    expect(panelSectionOf(editServicePath('s1'))).toBe('services')
    expect(panelSectionOf(ROUTES.panelSchedules)).toBe('schedules')
    expect(panelSectionOf(ROUTES.panelMore)).toBe('more')
    // "/panel/servicesx" não é Serviços.
    expect(panelSectionOf('/panel/servicesx')).toBe('agenda')
  })

  it('só o dono gere o estabelecimento', () => {
    expect(canManageBusiness('Owner')).toBe(true)
    expect(canManageBusiness('Professional')).toBe(false)
  })

  it('Saúde é a categoria sensível', () => {
    expect(isSensitiveCategory('Saude')).toBe(true)
    expect(isSensitiveCategory('Beleza')).toBe(false)
  })
})

describe('serviços', () => {
  it('troca só a situação, sem perder insumos e intervalos', () => {
    expect(withActive(service, false)).toEqual({
      name: 'Corte',
      description: null,
      durationMinutes: 30,
      bufferBeforeMinutes: 5,
      bufferAfterMinutes: 10,
      slotStepMinutes: 15,
      priceCents: 4_500,
      suppliesNote: 'Navalha descartável',
      isActive: false,
    })
  })

  it('grava o formulário mantendo o que a tela não edita', () => {
    const draft = {
      name: 'Corte novo',
      description: 'Com lavagem',
      durationMinutes: 40,
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 0,
      slotStepMinutes: 20,
      priceCents: 5_000,
      professionalIds: ['p1'],
    }

    expect(toSaveServiceRequest(draft, service)).toMatchObject({
      name: 'Corte novo',
      suppliesNote: 'Navalha descartável',
      isActive: true,
    })
    expect(toSaveServiceRequest(draft, null)).toMatchObject({ suppliesNote: null, isActive: true })
  })

  it('calcula quem ligar e quem desligar', () => {
    expect(professionalChanges(['p1', 'p2'], ['p2', 'p3'])).toEqual({
      enable: ['p3'],
      disable: ['p1'],
    })
    expect(professionalChanges([], [])).toEqual({ enable: [], disable: [] })
  })

  it('mostra os nomes de quem executa, inclusive desativados', () => {
    const item = toServiceListItem(service, [
      {
        id: 'p1',
        displayName: 'Marina',
        specialty: null,
        bio: null,
        isActive: false,
        isPubliclyVisible: false,
        hasPublicProfileConsent: false,
        membershipId: null,
        photo: null,
      },
    ])

    expect(item.professionalNames).toEqual(['Marina'])
  })

  it('pré-visualiza no primeiro dia com jornada, da primeira entrada à última saída', () => {
    // 2026-10-29 é quinta (4); a jornada abaixo é só de segunda (1): o exemplo é 02/11.
    const schedules = new Map([
      ['p1', [schedule({ startTime: '10:00:00', endTime: '14:00:00' })]],
      [
        'p2',
        [schedule({ id: 'w2', professionalId: 'p2', startTime: '08:00:00', endTime: '12:00:00' })],
      ],
    ])

    expect(previewHoursOf(schedules, '2026-10-29')).toEqual({ start: '08:00', end: '14:00' })
    expect(previewHoursOf(new Map(), '2026-10-29')).toBeNull()
  })
})

describe('equipe', () => {
  it('liga cada profissional aos serviços que executa', () => {
    const member = toTeamMember(
      {
        id: 'p1',
        displayName: 'Marina',
        specialty: null,
        bio: null,
        isActive: true,
        isPubliclyVisible: false,
        hasPublicProfileConsent: true,
        membershipId: 'm1',
        photo: null,
      },
      [service, { ...service, id: 's2', professionals: [] }],
    )

    expect(member.serviceIds).toEqual(['s1'])
    expect(member.hasAccount).toBe(true)
    expect(member.hasPublicProfileConsent).toBe(true)
  })
})

describe('semana ⇄ faixas com vigência', () => {
  const TODAY = '2026-10-30'
  // Segunda 09–12 e 13–18 desde janeiro; sábado 09–13 só até novembro; quarta 10–16 só a partir de dezembro.
  const rows = [
    schedule({ id: 'mon-am', startTime: '09:00:00', endTime: '12:00:00' }),
    schedule({ id: 'mon-pm', startTime: '13:00:00', endTime: '18:00:00' }),
    schedule({
      id: 'sat',
      dayOfWeek: 6,
      startTime: '09:00:00',
      endTime: '13:00:00',
      effectiveTo: '2026-11-30',
    }),
    schedule({
      id: 'wed-next',
      dayOfWeek: 3,
      startTime: '10:00:00',
      endTime: '16:00:00',
      effectiveFrom: '2026-12-01',
    }),
  ].map(toScheduleRow)

  it('monta a semana que vale no dia, sem o que ainda vai começar', () => {
    const week = toWeekSchedule(rows, TODAY)

    expect(week.monday).toEqual({
      enabled: true,
      ranges: [
        { start: '09:00', end: '12:00' },
        { start: '13:00', end: '18:00' },
      ],
    })
    expect(week.saturday.ranges).toEqual([{ start: '09:00', end: '13:00' }])
    expect(week.wednesday.enabled).toBe(false)
    expect(toWeekSchedule(rows, '2026-12-05').saturday.enabled).toBe(false)
    expect(toWeekSchedule(rows, '2026-12-05').wednesday.enabled).toBe(true)
  })

  it('lista em "Mudanças programadas" o que tem fim marcado ou ainda vai começar', () => {
    expect(scheduledChanges(rows, TODAY)).toEqual([
      { id: 'sat', label: 'Sábado 09:00 – 13:00', validity: 'De 01/01/2026 a 30/11/2026' },
      { id: 'wed-next', label: 'Quarta 10:00 – 16:00', validity: 'A partir de 01/12/2026' },
    ])
  })

  it('semana igual não grava nada', () => {
    expect(weekChanges(rows, toWeekSchedule(rows, TODAY), TODAY)).toEqual({
      close: [],
      remove: [],
      add: [],
    })
  })

  it('encerra na véspera o que saiu, mantém o que ficou e cria o novo a partir da data', () => {
    const week = applyRanges(
      toWeekSchedule(rows, TODAY),
      'monday',
      [
        { start: '09:00', end: '12:00' },
        { start: '14:00', end: '18:00' },
      ],
      false,
    )
    const changes = weekChanges(rows, week, '2026-11-03')

    expect(changes.close).toEqual([
      expect.objectContaining({ id: 'mon-pm', effectiveTo: '2026-11-02' }),
    ])
    expect(changes.remove).toEqual([])
    expect(changes.add).toEqual([
      {
        dayOfWeek: 1,
        start: '14:00',
        end: '18:00',
        effectiveFrom: '2026-11-03',
        effectiveTo: null,
      },
    ])
  })

  it('apaga em vez de encerrar a faixa que ainda nem tinha começado', () => {
    const week = toggleDay(toWeekSchedule(rows, '2026-12-01'), 'wednesday', false)
    const changes = weekChanges(rows, week, '2026-12-01')

    expect(changes.remove.map(({ id }) => id)).toEqual(['wed-next'])
    expect(changes.close.map(({ id }) => id)).toEqual([])
  })

  it('desligar o dia encerra as faixas dele; as guardadas no rascunho não voltam', () => {
    const week = toggleDay(toWeekSchedule(rows, TODAY), 'monday', false)
    const changes = weekChanges(rows, week, TODAY)

    expect(changes.close.map(({ id }) => id)).toEqual(['mon-am', 'mon-pm'])
    expect(changes.add).toEqual([])
  })
})

describe('jornadas e bloqueios', () => {
  it('lê e grava a jornada no formato da API', () => {
    expect(toScheduleRow(schedule({}))).toMatchObject({ start: '09:00', end: '18:00' })
    expect(
      toScheduleRequest({
        dayOfWeek: 0,
        start: '08:30',
        end: '12:00',
        effectiveFrom: '2026-11-01',
        effectiveTo: null,
      }),
    ).toEqual({
      dayOfWeek: 0,
      startTime: '08:30:00',
      endTime: '12:00:00',
      effectiveFrom: '2026-11-01',
      effectiveTo: null,
    })
  })

  it('converte o período do bloqueio pelo fuso do estabelecimento, nunca o do navegador', () => {
    const period = exceptionPeriod(
      {
        professionalId: null,
        kind: 'Block',
        startDate: '2026-11-03',
        startTime: '09:00',
        endDate: '2026-11-03',
        endTime: '12:00',
        reason: null,
      },
      TZ,
    )

    expect(period).toEqual({
      startsAt: '2026-11-03T12:00:00.000Z',
      endsAt: '2026-11-03T15:00:00.000Z',
    })
  })

  it('mostra o bloqueio no relógio do estabelecimento', () => {
    const item = toExceptionItem(
      {
        id: 'e1',
        professionalId: 'p1',
        kind: 'Vacation',
        startsAt: '2026-12-01T03:00:00Z',
        endsAt: '2026-12-10T03:00:00Z',
        reason: null,
        cancelledAppointments: 0,
      },
      TZ,
      () => 'Marina',
    )

    expect(item).toMatchObject({
      professionalName: 'Marina',
      startDate: '2026-12-01',
      startTime: '00:00',
      endDate: '2026-12-10',
    })
  })

  it('o 409 de faixa cruzada vira uma mensagem que diz o que fazer', () => {
    expect(errorMessage(new ApiError(409, 'work_schedule.overlaps'))).toBe(
      'Esse horário cruza outro horário do mesmo profissional.',
    )
    expect(errorMessage(new ApiError(403, 'auth.forbidden'))).toContain('permissão')
    expect(errorMessage(new ApiError(400, 'service.slot_step_invalid'))).toContain('passo')
  })
})
