import { describe, expect, it } from 'vitest'

import { MemoryRouter } from 'react-router'
import { ProfessionalPageScreen } from '.'
import type { ProfessionalPage, ProfessionalPageScreenProps } from './types'
import { renderToString } from 'react-dom/server'

const professional: ProfessionalPage = {
  id: 'p1',
  name: 'Marcos Lima',
  specialty: 'Barbeiro',
  bio: 'Cortes e barba há 10 anos.',
  registration: null,
  photo: null,
  business: {
    id: 'b1',
    name: 'Estúdio Duartina',
    address: 'Rua A, 10, Centro, Garça - SP',
    category: 'Beleza',
  },
  services: [
    { id: 's1', name: 'Corte masculino', durationMinutes: 30, priceCents: 5500, photo: null },
    { id: 's2', name: 'Barba', durationMinutes: 20, priceCents: 3000, photo: null },
  ],
  nextSlots: [
    { label: 'Hoje', times: ['14:00', '14:30'] },
    { label: 'Amanhã', times: ['09:00'] },
  ],
}

const render = (
  props: Partial<ProfessionalPageScreenProps> = {},
  page: Partial<ProfessionalPage> = {},
) =>
  renderToString(
    <MemoryRouter>
      <ProfessionalPageScreen
        data={{ status: 'ready', professional: { ...professional, ...page } }}
        onRequestRemoval={async () => null}
        {...props}
      />
    </MemoryRouter>,
  ).replaceAll('<!-- -->', '')

describe('ProfessionalPageScreen', () => {
  it('carregando: avisa que está carregando o perfil', () => {
    expect(render({ data: { status: 'loading' } })).toContain('Carregando o perfil')
  })

  it('erro: mostra a mensagem e "Tentar de novo"', () => {
    const html = render({
      data: { status: 'error', message: 'Sem conexão com o servidor.', onRetry: () => undefined },
    })

    expect(html).toContain('Sem conexão com o servidor.')
    expect(html).toContain('Tentar de novo')
  })

  it('vazio: sem serviço, o botão fica desligado e a página explica', () => {
    const html = render({}, { services: [], nextSlots: [] })

    expect(html).toContain('ainda não tem serviços para agendar')
    expect(html).toMatch(/<button[^>]*disabled[^>]*>Agendar com Marcos<\/button>/)
    expect(html).not.toContain('Próximos horários livres')
  })

  it('sucesso: iniciais sem foto, especialidade, sobre, serviços com preço e duração, horários e o estabelecimento', () => {
    const html = render()

    expect(html).toContain('Marcos Lima')
    expect(html).toContain('ML') // avatar com as iniciais
    expect(html).toContain('Barbeiro')
    expect(html).toContain('Cortes e barba há 10 anos.')
    expect(html).toContain('Agendar com Marcos')
    expect(html).toContain('Corte masculino')
    expect(html).toContain('30 min')
    expect(html).toContain('55,00')
    expect(html).toContain('Hoje: </span>14:00 · 14:30')
    expect(html).toContain('Amanhã: </span>09:00')
    expect(html).toContain('Estúdio Duartina')
    expect(html).toContain('Rua A, 10')
    expect(html).toContain('Solicitar remoção deste perfil')
  })

  it('sem horário nos dois dias, diz isso em vez de esconder o bloco', () => {
    const html = render(
      {},
      {
        nextSlots: [
          { label: 'Hoje', times: [] },
          { label: 'Amanhã', times: [] },
        ],
      },
    )

    expect(html).toContain('Nenhum horário livre hoje nem amanhã')
  })

  it('o registro profissional só aparece quando informado, discreto', () => {
    expect(render()).not.toContain('Registro profissional')
    expect(render({}, { registration: 'CRP 06/123456' })).toContain(
      'Registro profissional: CRP 06/123456',
    )
  })

  it('a nota do profissional fica escondida até existir média', () => {
    expect(render()).not.toContain('Nota ')
    expect(render({}, { rating: { average: 4.75, count: 12 } })).toContain(
      'Nota 4,8 · 12 avaliações',
    )
  })

  it('só oferece o pedido de remoção quando a tela recebe o tratamento dele', () => {
    expect(render({ onRequestRemoval: undefined })).not.toContain('Solicitar remoção')
  })
})
