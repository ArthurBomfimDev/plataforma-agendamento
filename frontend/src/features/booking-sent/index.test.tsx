import { describe, expect, it } from 'vitest'

import { BookingSentScreen } from '.'
import { MemoryRouter } from 'react-router'
import { renderToString } from 'react-dom/server'

// O React separa trechos de texto com `<!-- -->` no HTML do servidor; tiramos para comparar o texto.
const render = (element: React.ReactElement) =>
  renderToString(<MemoryRouter>{element}</MemoryRouter>).replaceAll('<!-- -->', '')

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000)

const screen = (sentAt: Date, professionalId: string | null = null) =>
  render(
    <BookingSentScreen
      businessId="estudio-duartina"
      serviceId="corte-masculino"
      professionalId={professionalId}
      date={new Date(2026, 8, 11)}
      time="09:30"
      sentAt={sentAt}
    />,
  )

describe('BookingSentScreen', () => {
  it('mostra o pedido pendente com o resumo do atendimento', () => {
    const html = screen(minutesAgo(0))

    expect(html).toContain('Aguardando confirmação do Estúdio Duartina')
    expect(html).toContain('Pendente')
    expect(html).toContain('sex, 11 de setembro · 09:30')
    expect(html).toContain('sex, 09:30')
    expect(html).toContain('24 h e 3 h antes')
  })

  it('conta o prazo de confirmação a partir do envio', () => {
    expect(screen(minutesAgo(2))).toMatch(/Expira em 11 h 5\d min/)
    expect(screen(minutesAgo(13 * 60))).toContain('Prazo de confirmação encerrado')
  })

  it('diz há quanto tempo o pedido foi enviado', () => {
    expect(screen(minutesAgo(0))).toContain('agora')
    expect(screen(minutesAgo(5))).toContain('há 5 min')
  })

  it('anuncia o estado de cada passo, não só pelo ícone', () => {
    const html = screen(minutesAgo(0))

    expect(html).toContain('Pedido enviado<span class="sr-only">, concluído</span>')
    expect(html).toContain('Empresa confirma<span class="sr-only">, pendente</span>')
  })

  // Abrir o diálogo e confirmar exigiria jsdom e Testing Library, que o projeto ainda não tem;
  // o fluxo foi conferido no navegador. Aqui só se garante que nada é cancelado sem confirmação.
  it('não abre a confirmação de cancelamento sozinha', () => {
    const html = screen(minutesAgo(0))

    expect(html).toContain('Cancelar pedido')
    expect(html).not.toContain('Cancelar este pedido?')
  })

  it('mostra o profissional quando houve escolha', () => {
    expect(screen(minutesAgo(0), 'marina-souza')).toContain('Marina Souza')
  })
})
