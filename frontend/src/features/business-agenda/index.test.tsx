import {
  buildRows,
  canPlace,
  confirmAppointment,
  dayLabel,
  durationLabel,
  findAppointment,
  freeLabel,
  moveAppointment,
  placeableStarts,
  rejectAppointment,
  toMinutes,
} from './consts'
import { describe, expect, it } from 'vitest'

import { BusinessAgendaScreen } from '.'
import { createMockAgendaDay } from './mock'
import { renderToString } from 'react-dom/server'

// O React separa trechos de texto com `<!-- -->` no HTML do servidor; tiramos para comparar o texto.
const render = () => renderToString(<BusinessAgendaScreen />).replaceAll('<!-- -->', '')

describe('BusinessAgendaScreen', () => {
  // A troca de profissional e de dia exigiria jsdom e Testing Library; aqui só o estado inicial.
  it('mostra a lista do primeiro profissional com intervalos livres e fim do expediente', () => {
    const html = render()

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

  it('mostra no desktop uma coluna por profissional e os indicadores', () => {
    const html = render()

    for (const name of ['Marina Souza', 'Rafael Lima', 'Carla Nunes']) {
      expect(html).toContain(`aria-label="${name}"`)
    }
    expect(html).toContain('sexta, 11 de setembro de 2026 · Estúdio Duartina')
    expect(html).toContain('4 pendentes')
    expect(html).toMatch(/R\$\s1\.240/)
    expect(html).toContain('2 h 14')
  })

  it('marca "Agenda" como a seção atual nas duas navegações', () => {
    const current = render().match(/aria-current="page"/g) ?? []
    expect(current).toHaveLength(2)
  })
})

describe('agenda do dia', () => {
  it('não abre intervalo livre entre itens encostados', () => {
    const [carla] = createMockAgendaDay().professionals.slice(2)
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
})

describe('ações da agenda', () => {
  const day = () => createMockAgendaDay(new Date('2026-09-11T12:00:00'))

  it('confirma o pedido e desconta dos pendentes do profissional', () => {
    const next = confirmAppointment(day(), 'apt-marina-3')

    expect(findAppointment(next, 'apt-marina-3')?.entry.status).toBe('confirmed')
    expect(next.professionals[0].pendingRequests).toBe(1)
  })

  it('recusa o pedido e libera o horário', () => {
    const next = rejectAppointment(day(), 'apt-marina-3')
    const marina = next.professionals[0]

    expect(findAppointment(next, 'apt-marina-3')).toBeNull()
    expect(canPlace(marina, toMinutes('14:00'), 60)).toBe(true)
  })

  it('remarca para outro profissional', () => {
    const next = moveAppointment(day(), {
      entryId: 'apt-marina-1',
      professionalId: 'carla-nunes',
      start: '11:00',
    })
    const found = findAppointment(next, 'apt-marina-1')

    expect(found?.professional.id).toBe('carla-nunes')
    expect(found?.entry.start).toBe('11:00')
    expect(next.professionals[0].entries.some(({ id }) => id === 'apt-marina-1')).toBe(false)
  })

  it('não deixa remarcar sobre outro item nem fora da jornada', () => {
    const [marina, rafael] = day().professionals

    // Rafael está na coloração das 11:00 às 12:30.
    expect(canPlace(rafael, toMinutes('12:00'), 30)).toBe(false)
    // Marina sai às 15:00.
    expect(canPlace(marina, toMinutes('14:45'), 30)).toBe(false)
    // O próprio item não conta como obstáculo.
    expect(canPlace(marina, toMinutes('09:15'), 30, 'apt-marina-1')).toBe(true)
  })

  it('lista os inícios livres de 15 em 15 min', () => {
    const [marina] = day().professionals

    expect(placeableStarts(marina, 30, 'apt-marina-1').slice(0, 4)).toEqual([
      '09:00',
      '09:15',
      '09:30',
      '09:45',
    ])
    expect(placeableStarts(marina, 30)).not.toContain('09:00')
  })
})
