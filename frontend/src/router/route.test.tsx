import { describe, expect, it } from 'vitest'

import { AppRoutes } from './route'
import { MemoryRouter } from 'react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { createQueryClient } from '@api/base'
import { prerender } from 'react-dom/static'

// No HTML do servidor as consultas não rodam (não há efeito); cada rota mostra o estado inicial.
// `prerender` espera os chunks das páginas (`lazy`) carregarem, em vez de parar no fallback do `Suspense`.
// O React separa trechos de texto com `<!-- -->`; tiramos para comparar o texto.
const renderAt = async (path: string) => {
  const { prelude } = await prerender(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return (await new Response(prelude).text()).replaceAll('<!-- -->', '')
}

describe('AppRoutes', () => {
  it('abre a Home em / e, sem localização escolhida, pede uma em vez de usar cidade fixa', async () => {
    const html = await renderAt('/')

    expect(html).toContain('O que você quer agendar?')
    expect(html).toContain('Escolha onde você quer agendar')
    expect(html).toContain('Escolher localização')
    expect(html).not.toContain('Buscando estabelecimentos…')
  })

  it('carrega o estabelecimento em /businesses/:businessId', async () => {
    expect(await renderAt('/businesses/b1')).toContain('Carregando…')
  })

  it('carrega a escolha de profissional e o calendário', async () => {
    expect(await renderAt('/businesses/b1/services/s1/professionals')).toContain('Carregando…')
    expect(await renderAt('/businesses/b1/services/s1/availability')).toContain('Carregando…')
  })

  it('exige sessão para revisar o pedido', async () => {
    const path = '/businesses/b1/services/s1/review?professional=p1&startsAt=2026-11-03T12:00:00Z'

    expect(await renderAt(path)).not.toContain('Revise seu pedido')
  })

  // A 404 de link montado à mão (sem horário ou sem agendamento) é coberta em `adapters.test.ts`,
  // em `readBookingSearch`/`readSentSearch`: no HTML do servidor o zustand lê o estado inicial da
  // store, então aqui não dá para simular uma sessão aberta.

  it('pede para entrar em /appointments sem sessão', async () => {
    expect(await renderAt('/appointments')).toContain(
      'Entre na sua conta para ver seus agendamentos.',
    )
  })

  it('abre criar conta em /sign-up', async () => {
    expect(await renderAt('/sign-up')).toContain('Data de nascimento')
  })

  it('abre "Confira seu e-mail" depois do cadastro, sem o endereço na URL', async () => {
    expect(await renderAt('/sign-up/check-email')).toContain('Confira seu e-mail')
  })

  it('abre os caminhos dos links dos e-mails (Onda 5B)', async () => {
    // No HTML do servidor o efeito não roda: com token, a tela fica em "conferindo".
    expect(await renderAt('/confirmar-email?token=abc')).toContain('Confirmando seu e-mail')
    expect(await renderAt('/redefinir-senha?token=abc')).toContain('Nova senha')
  })

  it('link sem token já cai no estado de link inválido', async () => {
    expect(await renderAt('/confirmar-email')).toContain('Link inválido')
    expect(await renderAt('/redefinir-senha')).toContain('Link inválido')
  })

  it('abre os resultados da busca com o filtro da URL', async () => {
    const html = await renderAt('/search?category=Beleza')

    expect(html).toContain('Resultados da busca')
    expect(html).toContain('Remover filtro Beleza')
  })

  it('abre esqueci minha senha', async () => {
    expect(await renderAt('/forgot-password')).toContain('Esqueci minha senha')
  })

  // A decisão do guard (sem sessão / consumidor / painel) é coberta em `panel.test.ts`
  // (`panelAccess`); aqui, só que sem sessão o painel e a conta não abrem.
  it.each(['/panel', '/panel/requests'])('não abre o painel em %s sem sessão', async (path) => {
    const html = await renderAt(path)

    expect(html).not.toContain('Painel do estabelecimento')
    expect(html).not.toContain('Agenda de hoje')
    expect(html).not.toContain('Pedidos pendentes')
  })

  it.each(['/painel/pedidos', '/painel/agenda'])(
    'o link do e-mail ao dono (%s) não cai na 404',
    async (path) => {
      expect(await renderAt(path)).not.toContain('Página não encontrada')
    },
  )

  it('não abre a conta em /context sem sessão', async () => {
    expect(await renderAt('/context')).not.toContain('Sua conta')
  })

  it('não abre Minha conta em /account sem sessão (7CF)', async () => {
    expect(await renderAt('/account')).not.toContain('Minha conta')
  })

  // A gestão (Onda 7D) mora dentro do painel: sem sessão, nenhuma tela abre. O guard por papel
  // (`canManageBusiness`) e a seção ativa (`panelSectionOf`) são cobertos em `manage.test.ts`.
  it.each([
    '/panel/services',
    '/panel/services/new',
    '/panel/services/s1',
    '/panel/professionals',
    '/panel/schedules',
    '/panel/photos',
    '/panel/settings',
    '/panel/more',
  ])('não abre %s sem sessão nem cai na 404', async (path) => {
    const html = await renderAt(path)

    expect(html).not.toContain('Painel do estabelecimento')
    expect(html).not.toContain('Página não encontrada')
  })

  it('abre a 404 em rota desconhecida', async () => {
    expect(await renderAt('/nao-existe')).toContain('Página não encontrada')
  })
})
