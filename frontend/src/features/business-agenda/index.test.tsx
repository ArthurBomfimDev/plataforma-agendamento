import {
  ACTION_SUCCESS,
  buildRows,
  canPlace,
  dayLabel,
  durationLabel,
  freeLabel,
  placeableStarts,
  summaryCards,
  summarize,
  toMinutes,
} from './consts'
import type { AgendaData, BusinessAgendaScreenProps } from './types'
import { FIXTURE_AGENDA_DATE, FIXTURE_BUSINESS_NAME, createFixtureAgendaDay } from './fixtures'
import { describe, expect, it } from 'vitest'

import { BusinessAgendaScreen } from '.'
import { renderToString } from 'react-dom/server'

const ready = (): AgendaData => ({ status: 'ready', day: createFixtureAgendaDay() })

// O React separa trechos de texto com `<!-- -->` no HTML do servidor; tiramos para comparar o texto.
const render = (overrides: Partial<BusinessAgendaScreenProps> = {}) =>
  renderToString(
    <BusinessAgendaScreen
      businessName={FIXTURE_BUSINESS_NAME}
      today={FIXTURE_AGENDA_DATE}
      date={FIXTURE_AGENDA_DATE}
      onDateChange={() => undefined}
      agenda={ready()}
      pendingRequests={4}
      onAction={async () => true}
      {...overrides}
    />,
  ).replaceAll('<!-- -->', '')

describe('BusinessAgendaScreen', () => {
  // A troca de profissional e de dia exigiria jsdom e Testing Library; aqui só o estado inicial.
  it('mostra a lista do primeiro profissional com intervalos livres e fim do expediente', () => {
    const html = render()

    expect(html).toContain('Agenda de hoje')
    expect(html).toContain('sexta, 11 de setembro')
    expect(html).toContain('Ana Ribeiro · confirmado')
    expect(html).toContain('1 h livre até 10:30')
    expect(html).toContain('2 h 10 livres até 13:00')
    expect(html).toContain('Bloqueio recorrente')
    expect(html).toMatch(/Carla Menezes · expira em [67] h/)
    expect(html).toContain('Fora do expediente')
  })

  it('marca o primeiro profissional como escolhido no seletor', () => {
    expect(render()).toMatch(/<button[^>]*aria-pressed="true"[^>]*>.*?Marina/)
  })

  it('mostra no desktop uma coluna por profissional e os indicadores somados da agenda', () => {
    const html = render()

    for (const name of ['Marina Souza', 'Rafael Lima', 'Carla Nunes']) {
      expect(html).toContain(`aria-label="${name}"`)
    }
    expect(html).toContain('sexta, 11 de setembro de 2026 · Estúdio Duartina')
    expect(html).toContain('4 pedidos pendentes no total')
    expect(html).toContain('Confirmados')
    expect(html).toMatch(/R\$\s1\.240/)
  })

  it('mostra "Agenda do dia" fora de hoje', () => {
    expect(render({ today: '2026-09-10' })).toContain('Agenda do dia')
  })

  it('avisa quando o dia não tem agendamento, mas mantém os horários livres para encaixe', () => {
    const day = createFixtureAgendaDay()
    const empty: AgendaData = {
      status: 'ready',
      day: {
        ...day,
        summary: summarize([]),
        professionals: day.professionals.map((p) => ({ ...p, entries: [], pendingRequests: 0 })),
      },
    }
    const html = render({ agenda: empty })

    expect(html).toContain('Nenhum agendamento hoje.')
    expect(html).toContain('Encaixar')
  })

  it('mostra o carregando e o erro com "Tentar de novo"', () => {
    expect(render({ agenda: { status: 'loading' } })).toContain('Carregando a agenda…')

    const html = render({
      agenda: { status: 'error', message: 'Sem conexão com o servidor.', onRetry: () => undefined },
    })
    expect(html).toContain('Sem conexão com o servidor.')
    expect(html).toContain('Tentar de novo')
  })

  it('não oferece remarcar: o backend não tem remarcação', () => {
    expect(render()).not.toContain('Remarcar')
  })
})

describe('agenda do dia', () => {
  it('não abre intervalo livre entre itens encostados', () => {
    const [carla] = createFixtureAgendaDay().professionals.slice(2)
    const rows = buildRows(carla).map((row) => row.type)

    // 09:00–10:00 livre · 10:00 corte · 10:30–12:00 livre · 12:00 folga · 13:00–15:00 livre ·
    // 15:00 barba · 15:20–16:00 livre · fim do expediente.
    expect(rows).toEqual(['free', 'entry', 'free', 'entry', 'free', 'entry', 'free', 'off-hours'])
  })

  it('formata durações e intervalos como no Figma', () => {
    expect(durationLabel(40)).toBe('40 min')
    expect(durationLabel(134)).toBe('2 h 14')
    expect(freeLabel('09:30', '10:30')).toBe('1 h livre até 10:30')
    expect(dayLabel('2026-09-11')).toBe('sexta, 11 de setembro')
  })

  it('soma os indicadores: falta não entra na receita', () => {
    const summary = summarize([
      { status: 'confirmed', priceCents: 5_000 },
      { status: 'pending', priceCents: 3_000 },
      { status: 'completed', priceCents: 2_000 },
      { status: 'no-show', priceCents: 9_000 },
    ])

    expect(summary).toEqual({
      appointmentsCount: 4,
      confirmedCount: 1,
      pendingCount: 1,
      expectedRevenueCents: 10_000,
    })
    expect(summaryCards(summary, 1)[0]?.caption).toBe('1 pedido pendente no total')
  })

  it('tem mensagem de sucesso para cada ação', () => {
    expect(Object.keys(ACTION_SUCCESS).sort()).toEqual(
      ['cancel', 'complete', 'confirm', 'noShow', 'reject'].sort(),
    )
  })

  it('encaixe: não deixa marcar sobre outro item nem fora da jornada', () => {
    const [marina, rafael] = createFixtureAgendaDay().professionals

    // Rafael está na coloração das 11:00 às 12:30.
    expect(canPlace(rafael, toMinutes('12:00'), 30)).toBe(false)
    // Marina sai às 15:00.
    expect(canPlace(marina, toMinutes('14:45'), 30)).toBe(false)
    // O próprio item não conta como obstáculo.
    expect(canPlace(marina, toMinutes('09:15'), 30, 'apt-marina-1')).toBe(true)
    expect(placeableStarts(marina, 30, 'apt-marina-1').slice(0, 2)).toEqual(['09:00', '09:15'])
  })
})
