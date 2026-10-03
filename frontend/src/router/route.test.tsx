import { describe, expect, it } from 'vitest'

import { AppRoutes } from './route'
import { MemoryRouter } from 'react-router'
import { renderToString } from 'react-dom/server'

// O React separa trechos de texto com `<!-- -->` no HTML do servidor; tiramos para comparar o texto.
const renderAt = (path: string) =>
  renderToString(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  ).replaceAll('<!-- -->', '')

describe('AppRoutes', () => {
  it('abre a Home em /', () => {
    expect(renderAt('/')).toContain('O que você quer agendar?')
  })

  it('abre a página do estabelecimento em /businesses/:businessId', () => {
    expect(renderAt('/businesses/estudio-duartina')).toContain('Aberto hoje até 18:00')
  })

  it('abre a escolha de profissional em /businesses/:businessId/services/:serviceId/professionals', () => {
    const path = '/businesses/estudio-duartina/services/corte-masculino/professionals'

    expect(renderAt(path)).toContain('Com quem você quer agendar?')
  })

  it('abre calendário e horários com o profissional vindo da busca', () => {
    const path =
      '/businesses/estudio-duartina/services/corte-masculino/availability?professional=rafael-lima'
    const html = renderAt(path)

    expect(html).toContain('Rafael Lima')
    expect(html).toContain('Horários — ')
  })

  it('abre a revisão do pedido com dia e horário vindos da busca', () => {
    const html = renderAt(
      '/businesses/estudio-duartina/services/corte-masculino/review?date=2026-09-11&time=09:30',
    )

    expect(html).toContain('Revise seu pedido')
    expect(html).toContain('09:30 — 10:00')
  })

  it('abre a 404 na revisão sem dia válido', () => {
    const path = '/businesses/estudio-duartina/services/corte-masculino/review?date=x&time=09:30'

    expect(renderAt(path)).toContain('Página não encontrada')
  })

  it('abre o pedido enviado com o instante do envio vindo da busca', () => {
    const sentAt = encodeURIComponent(new Date().toISOString())
    const html = renderAt(
      `/businesses/estudio-duartina/services/corte-masculino/sent?date=2026-09-11&time=09:30&sentAt=${sentAt}`,
    )

    expect(html).toContain('Pedido enviado')
    expect(html).toContain('Expira em')
  })

  it('abre a 404 no pedido enviado sem instante de envio', () => {
    const path =
      '/businesses/estudio-duartina/services/corte-masculino/sent?date=2026-09-11&time=09:30'

    expect(renderAt(path)).toContain('Página não encontrada')
  })

  it('abre meus agendamentos em /appointments', () => {
    expect(renderAt('/appointments')).toContain('Meus agendamentos')
  })

  it('abre a 404 em rota desconhecida', () => {
    expect(renderAt('/nao-existe')).toContain('Página não encontrada')
  })
})
