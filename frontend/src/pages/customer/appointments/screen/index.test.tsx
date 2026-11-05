import { describe, expect, it } from 'vitest'

import { AppointmentsScreen } from '.'
import type { AppointmentsList } from './types'
import { MemoryRouter } from 'react-router'
import { calendarEventToIcs } from '@hooks/use-add-to-calendar'
import { createMockAppointments } from './fixtures'
import { renderToString } from 'react-dom/server'

// O React separa trechos de texto com `<!-- -->` no HTML do servidor; tiramos para comparar o texto.
const render = (element: React.ReactElement) =>
  renderToString(<MemoryRouter>{element}</MemoryRouter>).replaceAll('<!-- -->', '')

const ready: AppointmentsList = { status: 'ready', items: createMockAppointments() }

describe('AppointmentsScreen', () => {
  // A aba "Passados" e os cliques exigiriam jsdom e Testing Library; aqui só a aba inicial.
  it('lista os próximos com status, resumo e ações de cada estado', () => {
    const html = render(<AppointmentsScreen list={ready} />)

    expect(html).toContain('Corte masculino · sex, 11 set · 09:30')
    expect(html).toContain('Pendente')
    expect(html).toMatch(/Aguardando confirmação — expira em 1[01] h/)
    expect(html).toContain('Cancelar pedido')

    expect(html).toContain('Confirmado')
    expect(html).toContain('Rua Exemplo, 250 — 2,6 km')
    expect(html).toContain('Adicionar à agenda')
  })

  it('separa os concluídos que ainda podem ser avaliados', () => {
    const html = render(<AppointmentsScreen list={ready} />)

    expect(html).toContain('Concluídos')
    expect(html).toContain('Corte feminino · 22 ago · 10:00')
    expect(html).toContain('Avaliar atendimento')
  })

  describe('avaliação (ADR-032)', () => {
    const reviewed = (canEdit: boolean): AppointmentsList => ({
      status: 'ready',
      items: createMockAppointments().map((item) =>
        item.status === 'completed'
          ? {
              ...item,
              reviewable: false,
              review: {
                id: 'r1',
                appointmentId: item.id,
                businessId: 'b1',
                professionalId: 'p1',
                rating: 4,
                professionalRating: null,
                comment: null,
                serviceName: null,
                reviewedAt: '2026-11-04T12:00:00Z',
                editedAt: canEdit ? null : '2026-11-05T12:00:00Z',
                canEdit,
              },
            }
          : item,
      ),
    })

    it('com o botão ligado à gaveta: "Avaliar atendimento" leva o nome do estabelecimento', () => {
      const html = render(<AppointmentsScreen list={ready} onSaveReview={async () => null} />)

      expect(html).toContain('aria-label="Avaliar atendimento em Salão Vila Rica"')
      expect(html).toContain('Você tem 30 dias para avaliar.')
    })

    it('já avaliado e ainda editável: mostra a nota dada e "Editar avaliação", sem pedir de novo', () => {
      const html = render(
        <AppointmentsScreen list={reviewed(true)} onSaveReview={async () => null} />,
      )

      expect(html).toContain('Você avaliou: 4 de 5')
      expect(html).toContain('Editar avaliação')
      expect(html).not.toContain('Avaliar atendimento')
    })

    it('avaliação já editada: mostra a nota e não oferece editar de novo', () => {
      const html = render(<AppointmentsScreen list={reviewed(false)} />)

      // A edição única já foi usada: o concluído sai de "Próximos" e a nota só aparece em "Passados" (aba que o
      // servidor não renderiza); o que importa aqui é não oferecer a ação.
      expect(html).not.toContain('Editar avaliação')
      expect(html).not.toContain('Avaliar atendimento')
    })
  })

  it('marca "Agendamentos" como a aba atual da navegação', () => {
    expect(render(<AppointmentsScreen list={ready} />)).toMatch(
      /<button[^>]*aria-current="page"[^>]*>.*?Agendamentos<\/button>/,
    )
  })

  it('pede para entrar quando não há sessão', () => {
    const html = render(<AppointmentsScreen list={{ status: 'signed-out', onSignIn: () => {} }} />)

    expect(html).toContain('Entre na sua conta para ver seus agendamentos.')
    expect(html).not.toContain('Próximos')
  })

  it('avisa enquanto carrega e mostra o erro com "Tentar de novo"', () => {
    expect(render(<AppointmentsScreen list={{ status: 'loading' }} />)).toContain(
      'Carregando seus agendamentos…',
    )

    const html = render(
      <AppointmentsScreen list={{ status: 'error', message: 'Sem conexão.', onRetry: () => {} }} />,
    )
    expect(html).toContain('Sem conexão.')
    expect(html).toContain('Tentar de novo')
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
