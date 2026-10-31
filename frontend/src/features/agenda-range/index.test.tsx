import type { AgendaRangeScreenProps, RangeAppointment } from './types'
import { describe, expect, it } from 'vitest'

import { AgendaRangeScreen } from '.'
import { daysOf } from '@router/agenda-filters'
import { periodLabel } from './consts'
import { renderToString } from 'react-dom/server'

const item = (fields: Partial<RangeAppointment>): RangeAppointment => ({
  id: 'a1',
  date: '2026-11-03',
  start: '09:00',
  end: '09:30',
  customerName: 'Ana Ribeiro',
  serviceName: 'Corte',
  professionalName: 'Marina',
  status: 'confirmed',
  ...fields,
})

const week = daysOf('2026-11-02', '2026-11-08')

const render = (overrides: Partial<AgendaRangeScreenProps> = {}) =>
  renderToString(
    <AgendaRangeScreen
      view="week"
      businessName="Estúdio Duartina"
      days={week}
      date="2026-11-04"
      today="2026-11-04"
      data={{
        status: 'ready',
        appointments: [
          item({
            id: 'a2',
            start: '14:00',
            end: '15:00',
            customerName: 'Bruno',
            status: 'pending',
          }),
          item({}),
        ],
      }}
      toolbar={<p>barra</p>}
      filtered={false}
      onPrevious={() => undefined}
      onNext={() => undefined}
      onOpenDay={() => undefined}
      {...overrides}
    />,
  ).replaceAll('<!-- -->', '')

describe('AgendaRangeScreen', () => {
  it('semana: um cartão por dia, em ordem de horário, com o chip de status e o dia vazio dito', () => {
    const html = render()

    expect(html).toContain('Agenda da semana')
    expect(html).toContain('2 a 8 de novembro de 2026')
    expect(html.indexOf('Ana Ribeiro')).toBeLessThan(html.indexOf('Bruno'))
    expect(html).toContain('Pendente')
    expect(html).toContain('Confirmado')
    expect(html.match(/Sem agendamento\./g)).toHaveLength(6)
    expect(html).toContain('· hoje')
    expect(html).toContain('barra')
  })

  it('mês: grade com a contagem de cada dia, que abre o dia', () => {
    const days = daysOf('2026-10-26', '2026-12-06')
    const html = render({ view: 'month', days, date: '2026-11-15' })

    expect(html).toContain('Agenda do mês')
    expect(html).toContain('novembro de 2026')
    expect(html).toContain('aria-label="terça, 3 nov: 2 agendamentos, 1 pendente"')
    expect(html.match(/<li><button/g)).toHaveLength(days.length)
  })

  it('vazio com filtro diz que é o filtro; carregando e erro', () => {
    expect(render({ data: { status: 'ready', appointments: [] }, filtered: true })).toContain(
      'Nenhum agendamento com esses filtros neste período.',
    )
    expect(render({ data: { status: 'loading' } })).toContain('Carregando a agenda…')
    const error = render({
      data: { status: 'error', message: 'Sem conexão com o servidor.', onRetry: () => undefined },
    })
    expect(error).toContain('Sem conexão com o servidor.')
    expect(error).toContain('Tentar de novo')
  })

  it('rótulo do período que atravessa meses', () => {
    expect(periodLabel('week', daysOf('2026-10-26', '2026-11-01'), '2026-10-28')).toBe(
      '26 de out a 1 de nov de 2026',
    )
  })
})
