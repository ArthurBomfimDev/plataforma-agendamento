import {
  MOCK_BLOCK_VALUES,
  MOCK_CONFIRMED_APPOINTMENTS,
  MOCK_HOLIDAY_RULES,
  MOCK_SCHEDULE_PROFESSIONALS,
  MOCK_SCHEDULE_TODAY,
} from './mock'
import {
  applyRanges,
  conflictsIn,
  easterSunday,
  hasSchedule,
  holidayRuleLabel,
  holidaysFrom,
  rangesLabel,
  toBlockDraft,
  toggleDay,
  validateBlock,
  validateRanges,
} from './consts'
import { describe, expect, it } from 'vitest'

import { WorkScheduleScreen } from '.'
import { format } from 'date-fns'
import { renderToString } from 'react-dom/server'

const [marina, , , juliana] = MOCK_SCHEDULE_PROFESSIONALS

// O React separa trechos de texto com `<!-- -->` no HTML do servidor; tiramos para comparar o texto.
const render = () =>
  renderToString(
    <WorkScheduleScreen
      professionals={MOCK_SCHEDULE_PROFESSIONALS}
      appointments={MOCK_CONFIRMED_APPOINTMENTS}
      holidays={holidaysFrom(MOCK_SCHEDULE_TODAY)}
      initialHolidayRules={MOCK_HOLIDAY_RULES}
      today={MOCK_SCHEDULE_TODAY}
      initialBlock={MOCK_BLOCK_VALUES}
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

  it('lista os conflitos do período e pergunta o que fazer', () => {
    const html = render()

    expect(html).toContain('3 agendamentos já confirmados neste período')
    expect(html).toContain('22 set · 10:00')
    expect(html).toContain('Os 3 atendimentos acontecem normalmente.')
    expect(html).toContain('Confirmar bloqueio')
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
  it('acha só os agendamentos do profissional dentro do período, inclusive nas pontas', () => {
    expect(
      conflictsIn(MOCK_CONFIRMED_APPOINTMENTS, 'marina-souza', '2026-09-22', '2026-09-24'),
    ).toHaveLength(2)
    expect(
      conflictsIn(MOCK_CONFIRMED_APPOINTMENTS, 'rafael-lima', '2026-09-21', '2026-09-28'),
    ).toEqual([])
    expect(
      conflictsIn(MOCK_CONFIRMED_APPOINTMENTS, 'marina-souza', '2026-09-28', '2026-09-21'),
    ).toEqual([])
  })

  it('não aceita período sem data, invertido ou no passado', () => {
    const today = MOCK_SCHEDULE_TODAY

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

  it('só manda cancelar quando o Owner escolhe cancelar', () => {
    const conflicts = conflictsIn(
      MOCK_CONFIRMED_APPOINTMENTS,
      'marina-souza',
      '2026-09-21',
      '2026-09-28',
    )

    expect(toBlockDraft(MOCK_BLOCK_VALUES, 'marina-souza', conflicts)).toEqual({
      professionalId: 'marina-souza',
      type: 'vacation',
      from: '2026-09-21',
      to: '2026-09-28',
      reason: null,
      cancelAppointmentIds: [],
    })
    expect(
      toBlockDraft({ ...MOCK_BLOCK_VALUES, conflictAction: 'cancel' }, 'marina-souza', conflicts)
        .cancelAppointmentIds,
    ).toEqual(['apt-marina-0922', 'apt-marina-0924', 'apt-marina-0926'])
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
