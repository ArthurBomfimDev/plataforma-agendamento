import type { ServiceListItem, ServicesData, ServicesScreenProps } from './types'
import { describe, expect, it } from 'vitest'
import { alertMessage, initialsOf, serviceSummary, subtitleOf } from './consts'

import { ServicesScreen } from '.'
import { renderToString } from 'react-dom/server'

/** O `Intl` separa "R$" do valor com espaço não separável. */
const NBSP = ' '

const services: ServiceListItem[] = [
  {
    id: 's2',
    name: 'Escova',
    description: null,
    durationMinutes: 45,
    blockedMinutes: 55,
    priceCents: 6_000,
    isActive: false,
    professionalNames: [],
    professionals: [],
  },
  {
    id: 's1',
    name: 'Corte masculino',
    description: 'Lavagem, corte e finalização',
    durationMinutes: 30,
    blockedMinutes: 45,
    priceCents: 4_500,
    isActive: true,
    professionalNames: ['Rafael Lima', 'Marina Souza'],
    professionals: [{ name: 'Rafael Lima' }, { name: 'Marina Souza' }],
  },
]

const ready = (items = services): ServicesData => ({ status: 'ready', services: items })

const render = (overrides: Partial<ServicesScreenProps> = {}) =>
  renderToString(
    <ServicesScreen
      data={ready()}
      businessName="Estúdio Duartina"
      categoryName="Beleza"
      sensitive={false}
      {...overrides}
    />,
  )
    .replaceAll('<!-- -->', '')
    .replaceAll(NBSP, ' ')

describe('ServicesScreen', () => {
  it('lista os ativos primeiro, com tempo bloqueado, preço, profissionais e estado em texto', () => {
    const html = render()

    expect(html).toContain('1 ativo · 1 pausado · Estúdio Duartina')
    expect(html.indexOf('Corte masculino')).toBeLessThan(html.indexOf('Escova'))
    expect(html).toContain('bloqueia 45 com os buffers')
    expect(html).toContain('Lavagem, corte e finalização')
    expect(html).toContain('R$ 45,00')
    expect(html).toContain('2 profissionais')
    expect(html).toContain('>Ativo<')
    expect(html).toContain('>Pausado<')
    expect(html).toContain('aria-label="Editar Corte masculino"')
    expect(html).not.toContain('Pausar Corte masculino')
    expect(html).not.toContain('Ativar Escova')
  })

  it('avisa no topo do serviço ativo sem quem execute, e não do pausado', () => {
    const html = render({
      data: ready([{ ...services[1]!, name: 'Hidratação', professionalNames: [] }, services[0]!]),
    })

    expect(html).toContain(
      '1 serviço sem profissional designado não aparece para quem busca — Hidratação.',
    )
    expect(html).toContain('designar profissional')
    expect(render()).not.toContain('sem profissional designado não aparece')
  })

  it('em Saúde, lembra que nome e descrição vão para a vitrine', () => {
    expect(render({ sensitive: true })).toContain('Estabelecimento de saúde')
    expect(render()).not.toContain('Estabelecimento de saúde')
  })

  it('sem serviço, convida a cadastrar o primeiro', () => {
    const html = render({ data: ready([]) })

    expect(html).toContain('Nenhum serviço cadastrado ainda')
    expect(html).toContain('Criar o primeiro serviço')
    expect(html).toContain('Estúdio Duartina · Beleza')
    expect(html).not.toContain('Novo serviço')
  })

  it('mostra o carregando e o erro com "Tentar de novo"', () => {
    expect(render({ data: { status: 'loading' } })).toContain('Carregando os serviços…')

    const html = render({
      data: { status: 'error', message: 'Sem conexão com o servidor.', onRetry: () => undefined },
    })
    expect(html).toContain('Sem conexão com o servidor.')
    expect(html).toContain('Tentar de novo')
    expect(html).not.toContain('Nenhum serviço cadastrado')
  })
})

describe('serviços do painel', () => {
  it('resume duração e preço', () => {
    expect(serviceSummary(services[1]!).replaceAll(NBSP, ' ')).toBe('30 min · R$ 45,00')
  })

  it('conta ativos e pausados no subtítulo', () => {
    expect(subtitleOf(services, 'Estúdio')).toBe('1 ativo · 1 pausado · Estúdio')
    expect(subtitleOf([services[1]!], 'Estúdio')).toBe('1 ativo · Estúdio')
  })

  it('concorda a mensagem do aviso no plural', () => {
    expect(alertMessage(['A', 'B'])).toBe(
      '2 serviços sem profissional designado não aparecem para quem busca — A, B.',
    )
  })

  it('tira as iniciais do primeiro e do último nome', () => {
    expect(initialsOf('Rafael Lima')).toBe('RL')
    expect(initialsOf('Ana')).toBe('A')
  })
})

describe('ServicesScreen · passo guiado da verificação', () => {
  const unassignedService: ServiceListItem = {
    id: 's3',
    name: 'Hidratação',
    description: null,
    durationMinutes: 45,
    blockedMinutes: 55,
    priceCents: 9_000,
    professionals: [],
    isActive: true,
    professionalNames: [],
  }
  const guidedStep = { number: 4, total: 6 }
  const withUnassigned = ready([...services, unassignedService])

  it('destaca o serviço ativo sem profissional e mostra a ação do passo ao lado dele', () => {
    const html = render({ data: withUnassigned, guidedStep, onEdit: () => undefined })

    expect(html).toContain('Passo 4 de 6 · escolha quem executa Hidratação')
    expect(html).toContain('Designar profissional')
    expect(html).toContain('some da busca mesmo marcado como Ativo')
    expect(html).toContain('outline-(--border-focus)') // a linha destacada da tabela
    expect(html).toContain('border-(--border-focus)') // o cartão destacado do celular
  })

  it('no passo guiado o aviso do topo some: a barra do serviço já diz o mesmo', () => {
    const guided = render({ data: withUnassigned, guidedStep })
    const normal = render({ data: withUnassigned })

    expect(guided).not.toContain('não aparece para quem busca')
    expect(normal).toContain('não aparece para quem busca')
    expect(normal).not.toContain('Passo 4 de 6')
  })

  it('sem serviço sem profissional, não há o que destacar mesmo no passo guiado', () => {
    const html = render({ guidedStep })

    expect(html).not.toContain('Passo 4 de 6')
    expect(html).not.toContain('Designar profissional')
  })

  it('carregando e erro continuam como estavam, sem a barra do passo', () => {
    expect(render({ data: { status: 'loading' }, guidedStep })).toContain('Carregando os serviços…')
    expect(
      render({
        data: { status: 'error', message: 'Falhou.', onRetry: () => undefined },
        guidedStep,
      }),
    ).not.toContain('Passo 4 de 6')
  })
})
