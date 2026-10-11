import { describe, expect, it } from 'vitest'

import { AppointmentsScreen } from '.'
import { MemoryRouter } from 'react-router'
import { calendarEventToIcs } from '@hooks/use-add-to-calendar'
import { renderToString } from 'react-dom/server'

// O React separa trechos de texto com `<!-- -->` no HTML do servidor; tiramos para comparar o texto.
const render = (element: React.ReactElement) =>
  renderToString(<MemoryRouter>{element}</MemoryRouter>).replaceAll('<!-- -->', '')

describe('AppointmentsScreen', () => {
  // A aba "Passados" e os cliques exigiriam jsdom e Testing Library; aqui só a aba inicial.
  it('lista os próximos com status, resumo e ações de cada estado', () => {
    const html = render(<AppointmentsScreen />)

    expect(html).toContain('Corte masculino · sex, 11 set · 09:30')
    expect(html).toContain('Pendente')
    expect(html).toMatch(/Aguardando confirmação — expira em 1[01] h/)
    expect(html).toContain('Cancelar pedido')

    expect(html).toContain('Confirmado')
    expect(html).toContain('Rua Exemplo, 250 — 2,6 km')
    expect(html).toContain('Adicionar à agenda')
  })

  it('separa os concluídos que ainda podem ser avaliados', () => {
    const html = render(<AppointmentsScreen />)

    expect(html).toContain('Concluídos')
    expect(html).toContain('Corte feminino · 22 ago · 10:00')
    expect(html).toContain('Avaliar atendimento')
  })

  it('marca "Agendamentos" como a aba atual da navegação', () => {
    expect(render(<AppointmentsScreen />)).toMatch(
      /<button[^>]*aria-current="page"[^>]*>.*?Agendamentos<\/button>/,
    )
  })
})

describe('calendarEventToIcs', () => {
  const ics = calendarEventToIcs({
    id: 'apt-1',
    title: 'Corte + barba — Barbearia Norte',
    location: 'Rua Exemplo, 250',
    date: '2026-09-14',
    time: '15:00',
    durationMinutes: 60,
    timeZone: 'America/Sao_Paulo',
  })

  it('usa hora local com o fuso IANA, nunca offset fixo', () => {
    expect(ics).toContain('DTSTART;TZID=America/Sao_Paulo:20260914T150000')
    expect(ics).toContain('DTEND;TZID=America/Sao_Paulo:20260914T160000')
  })

  it('escapa vírgula no texto e separa linhas com CRLF', () => {
    expect(ics).toContain('LOCATION:Rua Exemplo\\, 250')
    expect(ics.split('\r\n')[0]).toBe('BEGIN:VCALENDAR')
  })
})
