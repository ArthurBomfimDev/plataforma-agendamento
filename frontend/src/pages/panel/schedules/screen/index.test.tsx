import {
  ALL_PROFESSIONALS,
  applyRanges,
  easterSunday,
  hasSchedule,
  holidayRuleLabel,
  holidaysFrom,
  rangesLabel,
  toExceptionDraft,
  toggleDay,
  validateBlock,
  validateRanges,
} from './consts'
import {
  MOCK_BLOCK_VALUES,
  MOCK_EXCEPTIONS,
  MOCK_HOLIDAY_RULES,
  MOCK_SCHEDULE_PROFESSIONALS,
  MOCK_SCHEDULE_TODAY,
} from './fixtures'
import { describe, expect, it } from 'vitest'

import type { WorkScheduleScreenProps } from './types'
import { WorkScheduleScreen } from '.'
import { format } from 'date-fns'
import { renderToString } from 'react-dom/server'

const [marina, , , juliana] = MOCK_SCHEDULE_PROFESSIONALS

// O React separa trechos de texto com `<!-- -->` no HTML do servidor; tiramos para comparar o texto.
const render = (overrides: Partial<WorkScheduleScreenProps> = {}) =>
  renderToString(
    <WorkScheduleScreen
      professionals={{ status: 'ready', items: MOCK_SCHEDULE_PROFESSIONALS }}
      exceptions={{ status: 'ready', items: MOCK_EXCEPTIONS }}
      holidays={holidaysFrom(MOCK_SCHEDULE_TODAY)}
      initialHolidayRules={MOCK_HOLIDAY_RULES}
      today={MOCK_SCHEDULE_TODAY}
      {...overrides}
    />,
  )
    .replaceAll('<!-- -->', '')
    .replaceAll('&#x27;', "'")

describe('WorkScheduleScreen', () => {
  it('mostra a semana da Marina como no wireframe', () => {
    const html = render()

    expect(html).toContain('Jornada — Marina Souza')
    expect(html).toContain('09:00 – 12:00 · 13:00 – 20:00')
    expect(html).toContain('Sem expediente')
    expect(html).toContain('Semana recorrente')
  })

  it('marca quem não tem jornada sem depender só de cor', () => {
    const html = render()

    expect(html).toContain('sem jornada')
    expect(html).toContain('Profissional sem jornada não gera horário nenhum')
  })

  it('mostra a vigência, as mudanças programadas e os próximos bloqueios', () => {
    const html = render()

    expect(html).toContain('Vale a partir de')
    expect(html).toContain('Mudanças programadas')
    expect(html).toContain('Sábado 09:00 – 13:00')
    expect(html).toContain('Próximos bloqueios')
    expect(html).toContain('Férias · Marina Souza')
    expect(html).toContain('Bloqueio · Estabelecimento inteiro')
    expect(html).toContain('05/10/2026, 13:00 – 18:00')
  })

  it('oferece o estabelecimento inteiro e o turno extra no bloqueio', () => {
    const html = render()

    expect(html).toContain('Estabelecimento inteiro')
    expect(html).toContain('Dia inteiro')
    expect(html).toContain('Confirmar bloqueio')
  })

  it('avisa que as regras de feriado ainda não são salvas', () => {
    expect(render()).toContain('As regras de feriado ainda não são salvas')
  })

  it('trata carregando, erro e equipe vazia', () => {
    expect(render({ professionals: { status: 'loading' } })).toContain('Carregando as jornadas…')
    expect(
      render({
        professionals: { status: 'error', message: 'Sem conexão.', onRetry: () => undefined },
      }),
    ).toContain('Sem conexão.')
    expect(render({ professionals: { status: 'ready', items: [] } })).toContain(
      'Nenhum profissional ativo.',
    )
  })

  it('mostra os feriados com a regra de cada um', () => {
    const html = render()

    expect(html).toContain('Independência')
    expect(html).toContain('Especial 09–13')
    expect(html).toContain('Fechado')
  })
})

describe('jornada recorrente', () => {
  it('escreve as faixas como no Figma', () => {
    expect(rangesLabel(marina.schedule.monday.ranges)).toBe('09:00 – 12:00 · 13:00 – 18:00')
  })

  it('aplica as invariantes do WorkSchedule', () => {
    expect(validateRanges([{ start: '09:00', end: '12:00' }])).toBeNull()
    expect(validateRanges([{ start: '12:00', end: '09:00' }])).toBe(
      'Cada faixa precisa terminar depois de começar.',
    )
    expect(
      validateRanges([
        { start: '13:00', end: '18:00' },
        { start: '09:00', end: '13:30' },
      ]),
    ).toBe('As faixas 09:00 – 13:30 e 13:00 – 18:00 se sobrepõem.')
    // Encostar não é sobrepor: 12:00 termina uma e começa a outra.
    expect(
      validateRanges([
        { start: '09:00', end: '12:00' },
        { start: '12:00', end: '18:00' },
      ]),
    ).toBeNull()
  })

  it('aplica um dia aos dias úteis sem mexer no fim de semana', () => {
    const ranges = [{ start: '10:00', end: '16:00' }]
    const week = applyRanges(juliana.schedule, 'wednesday', ranges, true)

    expect(week.monday).toEqual({ enabled: true, ranges })
    expect(week.friday).toEqual({ enabled: true, ranges })
    expect(week.saturday.enabled).toBe(false)
    expect(hasSchedule(juliana.schedule)).toBe(false)
    expect(hasSchedule(week)).toBe(true)
  })

  it('guarda as faixas ao desligar e dá a faixa padrão a um dia vazio', () => {
    const off = toggleDay(marina.schedule, 'monday', false)

    expect(off.monday.ranges).toEqual(marina.schedule.monday.ranges)
    expect(toggleDay(marina.schedule, 'sunday', true).sunday.ranges).toEqual([
      { start: '09:00', end: '18:00' },
    ])
  })
})

describe('bloqueio de período', () => {
  const today = MOCK_SCHEDULE_TODAY

  it('não aceita período sem data, invertido ou no passado', () => {
    expect(validateBlock(MOCK_BLOCK_VALUES, today)).toEqual({})
    expect(validateBlock({ ...MOCK_BLOCK_VALUES, from: '', to: '' }, today)).toEqual({
      from: 'Escolha o primeiro dia.',
      to: 'Escolha o último dia.',
    })
    expect(validateBlock({ ...MOCK_BLOCK_VALUES, to: '2026-09-20' }, today).to).toBe(
      'Precisa ser depois do início.',
    )
    expect(validateBlock({ ...MOCK_BLOCK_VALUES, from: '2026-09-01' }, today).from).toBe(
      'Não dá para bloquear o passado.',
    )
  })

  it('exige profissional e horário no turno extra, e motivo para cancelar', () => {
    const extra = { ...MOCK_BLOCK_VALUES, kind: 'ExtraShift' as const, target: ALL_PROFESSIONALS }

    expect(validateBlock(extra, today).target).toBe('Turno extra precisa de um profissional.')
    expect(
      validateBlock(
        { ...MOCK_BLOCK_VALUES, allDay: false, to: '2026-09-21', endTime: '08:00' },
        today,
      ).endTime,
    ).toBe('O fim precisa ser depois do início.')
    expect(validateBlock({ ...MOCK_BLOCK_VALUES, conflictAction: 'cancel' }, today)).toEqual({
      cancellationReason: 'Informe o motivo: ele aparece para quem tinha horário.',
    })
  })

  it('manda o dia inteiro até 00:00 do dia seguinte ao último', () => {
    expect(toExceptionDraft(MOCK_BLOCK_VALUES)).toEqual({
      professionalId: 'marina-souza',
      kind: 'Vacation',
      startDate: '2026-09-21',
      startTime: '00:00',
      endDate: '2026-09-29',
      endTime: '00:00',
      reason: null,
    })
  })

  it('manda o horário escolhido e o estabelecimento inteiro como profissional nulo', () => {
    expect(
      toExceptionDraft({
        ...MOCK_BLOCK_VALUES,
        kind: 'Block',
        target: ALL_PROFESSIONALS,
        allDay: false,
        to: '2026-09-21',
        startTime: '13:00',
        endTime: '18:00',
        reason: '  Reforma  ',
      }),
    ).toEqual({
      professionalId: null,
      kind: 'Block',
      startDate: '2026-09-21',
      startTime: '13:00',
      endDate: '2026-09-21',
      endTime: '18:00',
      reason: 'Reforma',
    })
  })
})

describe('feriados', () => {
  it('calcula a Páscoa pelo algoritmo de Gauss', () => {
    expect(format(easterSunday(2026), 'yyyy-MM-dd')).toBe('2026-04-05')
    expect(format(easterSunday(2027), 'yyyy-MM-dd')).toBe('2027-03-28')
  })

  it('lista os feriados do mês corrente em diante, como no wireframe', () => {
    expect(holidaysFrom('2026-09-11').map(({ date }) => date)).toEqual([
      '2026-09-07',
      '2026-10-12',
      '2026-11-02',
      '2026-11-15',
      '2026-11-20',
      '2026-12-25',
    ])
  })

  it('escreve a regra como na pílula do Figma', () => {
    expect(holidayRuleLabel({ kind: 'closed' })).toBe('Fechado')
    expect(holidayRuleLabel({ kind: 'special', start: '09:00', end: '13:00' })).toBe(
      'Especial 09–13',
    )
    expect(holidayRuleLabel({ kind: 'special', start: '09:30', end: '13:00' })).toBe(
      'Especial 09:30–13',
    )
  })
})
