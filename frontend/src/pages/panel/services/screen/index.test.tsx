import type { ServiceListItem, ServicesData, ServicesScreenProps } from './types'
import { describe, expect, it } from 'vitest'
import { professionalsLabel, serviceSummary } from './consts'

import { ServicesScreen } from '.'
import { renderToString } from 'react-dom/server'

/** O `Intl` separa "R$" do valor com espaço não separável. */
const NBSP = ' '

const services: ServiceListItem[] = [
  {
    id: 's2',
    name: 'Escova',
    durationMinutes: 45,
    priceCents: 6_000,
    isActive: false,
    professionalNames: [],
  },
  {
    id: 's1',
    name: 'Corte masculino',
    durationMinutes: 30,
    priceCents: 4_500,
    isActive: true,
    professionalNames: ['Rafael Lima', 'Marina Souza'],
  },
]

const ready = (items = services): ServicesData => ({ status: 'ready', services: items })

const render = (overrides: Partial<ServicesScreenProps> = {}) =>
  renderToString(
    <ServicesScreen
      data={ready()}
      businessName="Estúdio Duartina"
      sensitive={false}
      {...overrides}
    />,
  )
    .replaceAll('<!-- -->', '')
    .replaceAll(NBSP, ' ')

describe('ServicesScreen', () => {
  it('lista os ativos primeiro, com duração, preço, profissionais e situação em texto', () => {
    const html = render()

    expect(html).toContain('1 ativo de 2 · Estúdio Duartina')
    expect(html.indexOf('Corte masculino')).toBeLessThan(html.indexOf('Escova'))
    expect(html).toContain('30 min · R$ 45,00')
    expect(html).toContain('Marina Souza, Rafael Lima')
    expect(html).toContain('>Ativo</span>')
    expect(html).toContain('>Inativo</span>')
    expect(html).toContain('aria-label="Desativar Corte masculino"')
    expect(html).toContain('aria-label="Ativar Escova"')
  })

  it('avisa quando o serviço não tem quem execute', () => {
    expect(render()).toContain('Nenhum profissional: o serviço não aparece para agendar.')
  })

  it('em Saúde, lembra que nome e descrição vão para a vitrine', () => {
    expect(render({ sensitive: true })).toContain('Estabelecimento de saúde')
    expect(render()).not.toContain('Estabelecimento de saúde')
  })

  it('sem serviço, convida a cadastrar o primeiro', () => {
    const html = render({ data: ready([]) })

    expect(html).toContain('Nenhum serviço cadastrado.')
    expect(html).toContain('Cadastrar o primeiro serviço')
  })

  it('mostra o carregando e o erro com "Tentar de novo"', () => {
    expect(render({ data: { status: 'loading' } })).toContain('Carregando os serviços…')

    const html = render({
      data: { status: 'error', message: 'Sem conexão com o servidor.', onRetry: () => undefined },
    })
    expect(html).toContain('Sem conexão com o servidor.')
    expect(html).toContain('Tentar de novo')
    expect(html).not.toContain('Nenhum serviço cadastrado.')
  })
})

describe('serviços do painel', () => {
  it('resume duração e preço', () => {
    expect(serviceSummary(services[1]!).replaceAll(NBSP, ' ')).toBe('30 min · R$ 45,00')
  })

  it('ordena os nomes dos profissionais', () => {
    expect(professionalsLabel(['Rafael', 'Ana'])).toBe('Ana, Rafael')
  })
})
