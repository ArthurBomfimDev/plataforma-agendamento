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

  it('abre a 404 em rota desconhecida', () => {
    expect(renderAt('/nao-existe')).toContain('Página não encontrada')
  })
})
