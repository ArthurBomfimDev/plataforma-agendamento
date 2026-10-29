import type { ExceptionItem, ScheduleRow, SchedulesScreenProps } from './types'
import { describe, expect, it } from 'vitest'
import {
  exceptionWhenLabel,
  newExceptionDraft,
  newScheduleDraft,
  rowsOfDay,
  validateException,
  validateSchedule,
  validityLabel,
} from './consts'

import { SchedulesScreen } from '.'
import { renderToString } from 'react-dom/server'

const rows: ScheduleRow[] = [
  {
    id: 'w2',
    dayOfWeek: 1,
    start: '14:00',
    end: '18:00',
    effectiveFrom: '2026-09-01',
    effectiveTo: null,
  },
  {
    id: 'w1',
    dayOfWeek: 1,
    start: '09:00',
    end: '12:00',
    effectiveFrom: '2026-09-01',
    effectiveTo: null,
  },
  {
    id: 'w3',
    dayOfWeek: 6,
    start: '09:00',
    end: '13:00',
    effectiveFrom: '2026-09-01',
    effectiveTo: '2026-12-31',
  },
]

const exception: ExceptionItem = {
  id: 'e1',
  professionalName: null,
  kind: 'DayOff',
  startDate: '2026-11-15',
  startTime: '00:00',
  endDate: '2026-11-16',
  endTime: '00:00',
  reason: 'Feriado local',
}

const render = (overrides: Partial<SchedulesScreenProps> = {}) =>
  renderToString(
    <SchedulesScreen
      businessName="Estúdio Duartina"
      professionals={[
        { id: 'p1', name: 'Marina Souza' },
        { id: 'p2', name: 'Rafael Lima' },
      ]}
      selectedId="p1"
      onSelect={() => undefined}
      schedules={{ status: 'ready', items: rows }}
      exceptions={{ status: 'ready', items: [exception] }}
      today="2026-10-29"
      {...overrides}
    />,
  ).replaceAll('<!-- -->', '')

describe('SchedulesScreen', () => {
  it('mostra a semana do profissional escolhido, com os dias fechados', () => {
    const html = render()

    expect(html).toContain('Jornada semanal')
    expect(html).toMatch(/<option value="p1" selected="">Marina Souza<\/option>/)
    expect(html.indexOf('09:00 – 12:00')).toBeLessThan(html.indexOf('14:00 – 18:00'))
    expect(html).toContain('De 01/09/2026 a 31/12/2026')
    expect(html).toContain('Desde 01/09/2026')
    expect(html.match(/>Fechado</g)).toHaveLength(5)
    expect(html).toContain('aria-label="Editar segunda, 09:00 às 12:00"')
    expect(html).toContain('aria-label="Remover sábado, 09:00 às 13:00"')
  })

  it('lista os bloqueios com tipo, para quem, período e observação', () => {
    const html = render()

    expect(html).toContain('Folga · Estabelecimento inteiro')
    expect(html).toContain('15/11/2026, 00:00 – 16/11/2026, 00:00')
    expect(html).toContain('Feriado local')
  })

  it('avisa quando o profissional não tem jornada e quando não há bloqueio', () => {
    const html = render({
      schedules: { status: 'ready', items: [] },
      exceptions: { status: 'ready', items: [] },
    })

    expect(html).toContain('Marina Souza ainda não tem jornada')
    expect(html).toContain('Nenhum bloqueio daqui para frente.')
  })

  it('sem profissional ativo, manda cadastrar a equipe', () => {
    expect(render({ professionals: [], selectedId: null })).toContain(
      'Nenhum profissional ativo. Cadastre a equipe em Profissionais.',
    )
  })

  it('mostra o carregando e o erro de cada parte', () => {
    const loading = render({ schedules: { status: 'loading' }, exceptions: { status: 'loading' } })
    expect(loading).toContain('Carregando a jornada…')
    expect(loading).toContain('Carregando os bloqueios…')

    const error = render({
      schedules: {
        status: 'error',
        message: 'Sem conexão com o servidor.',
        onRetry: () => undefined,
      },
    })
    expect(error).toContain('Sem conexão com o servidor.')
    expect(error).toContain('Tentar de novo')
  })
})

describe('jornadas e bloqueios', () => {
  it('ordena as faixas do dia pelo início', () => {
    expect(rowsOfDay(rows, 1).map(({ id }) => id)).toEqual(['w1', 'w2'])
    expect(rowsOfDay(rows, 0)).toEqual([])
  })

  it('aplica as regras do WorkSchedule antes de enviar', () => {
    expect(validateSchedule(newScheduleDraft('2026-10-29'))).toEqual({})
    expect(validateSchedule({ ...newScheduleDraft('2026-10-29'), end: '08:00' }).end).toBe(
      'O fim precisa ser depois do início.',
    )
    expect(
      validateSchedule({ ...newScheduleDraft('2026-10-29'), effectiveTo: '2026-10-01' })
        .effectiveTo,
    ).toBe('Precisa ser depois da data inicial.')
  })

  it('aplica as regras do bloqueio: período válido e turno extra com profissional', () => {
    const draft = newExceptionDraft('2026-10-29')

    expect(validateException(draft)).toEqual({})
    expect(validateException({ ...draft, endTime: '08:00' }).endDate).toBe(
      'O fim precisa ser depois do início.',
    )
    expect(validateException({ ...draft, kind: 'ExtraShift' }).professionalId).toBe(
      'Turno extra precisa de um profissional.',
    )
    expect(validateException({ ...draft, kind: 'ExtraShift', professionalId: 'p1' })).toEqual({})
  })

  it('escreve vigência e período em português', () => {
    expect(validityLabel(rows[0]!)).toBe('Desde 01/09/2026')
    expect(
      exceptionWhenLabel({
        startDate: '2026-11-03',
        startTime: '09:00',
        endDate: '2026-11-03',
        endTime: '12:00',
      }),
    ).toBe('03/11/2026, 09:00 – 12:00')
  })
})
