import { bannerState, labelOf, missingItems, nextPendingKey, stepOf } from './consts'
import { describe, expect, it } from 'vitest'

import { BusinessStatusBanner } from '.'
import type { BusinessStatusBannerProps } from './types'
import type { ChecklistItemResponse } from '@api/models'
import { renderToString } from 'react-dom/server'

const item = (key: string, done: boolean, requiredForSubmit = true): ChecklistItemResponse => ({
  key,
  done,
  requiredForSubmit,
})
const noop = () => undefined

const draft = {
  status: 'Draft',
  verificationLevel: 'Unverified',
  category: 'Beleza',
  reason: null,
} as const

const render = (overrides: Partial<BusinessStatusBannerProps> = {}) =>
  renderToString(
    <BusinessStatusBanner
      business={draft}
      checklist={[item('terms', true), item('professional', false)]}
      busy={false}
      showApproved={false}
      onDismissApproved={noop}
      onPublish={noop}
      onSubmit={noop}
      onFix={noop}
      {...overrides}
    />,
  ).replaceAll('<!-- -->', '')

describe('bannerState', () => {
  it('"Reprovado" é rascunho com nível Rejected; os outros seguem o status', () => {
    expect(bannerState({ status: 'Draft', verificationLevel: 'Unverified' })).toBe('draft')
    expect(bannerState({ status: 'Draft', verificationLevel: 'Rejected' })).toBe('rejected')
    expect(bannerState({ status: 'PendingReview', verificationLevel: 'UnderReview' })).toBe(
      'review',
    )
    expect(bannerState({ status: 'Suspended', verificationLevel: 'Verified' })).toBe('suspended')
    expect(bannerState({ status: 'Active', verificationLevel: 'Verified' })).toBe('active')
  })
})

describe('checklist', () => {
  it('só entram os itens que o servidor exige, e cada chave tem texto em português', () => {
    const list = [item('terms', false), item('photo', false, false), item('work_schedule', true)]

    expect(missingItems(list).map(({ key }) => key)).toEqual(['terms'])
    expect(labelOf('responsible')).toContain('registro no conselho')
    expect(labelOf('chave_nova')).toBe('chave_nova') // sem texto: mostra a chave em vez de esconder
  })
})

describe('BusinessStatusBanner', () => {
  it('rascunho: faixa fechada com título, consequência, progresso em texto e segmentos, e ação sem "Dispensar"', () => {
    const html = render()

    expect(html).toContain('role="status"')
    expect(html).toContain('aria-live="polite"')
    expect(html).toContain('Rascunho · o estabelecimento não aparece na busca')
    expect(html).toContain(
      'Falta 1 item obrigatório. Nenhum consumidor consegue encontrar ou agendar.',
    )
    expect(html).toContain('1 de 2 concluídos')
    expect(html.match(/data-segment="done"/g)).toHaveLength(1)
    expect(html.match(/data-segment="pending"/g)).toHaveLength(1)
    expect(html).toContain('Continuar verificação')
    expect(html).not.toContain('Dispensar')
    expect(html).not.toContain('Publicar meu estabelecimento') // o envio mora no rodapé da lista aberta
  })

  it('o chevron é um botão com aria-expanded e aria-controls apontando para o painel', () => {
    const html = render()

    expect(html).toContain('aria-expanded="false"')
    expect(html).toMatch(/aria-controls="([^"]+)"/)
    const id = /aria-controls="([^"]+)"/.exec(html)?.[1]
    expect(html).toContain(`id="${id}"`)
    expect(html).toContain('hidden')
  })

  it('checklist completa: a ação da faixa vira "Revisar e enviar"', () => {
    const html = render({ checklist: [item('terms', true), item('professional', true)] })

    expect(html).toContain('Revisar e enviar')
    expect(html).toContain('Tudo pronto')
    expect(html).not.toContain('Continuar verificação')
  })

  it('carregando a checklist: "Conferindo o que falta…", sem progresso nem ação', () => {
    const html = render({ checklist: undefined })

    expect(html).toContain('Conferindo o que falta')
    expect(html).not.toContain('concluídos')
    expect(html).not.toContain('Continuar verificação')
  })

  it('erro ao buscar a checklist: a mensagem aparece na faixa', () => {
    const html = render({ checklist: undefined, checklistError: 'Sem conexão com o servidor.' })

    expect(html).toContain('Sem conexão com o servidor.')
  })

  it('erro ao publicar aparece na faixa, com role="alert"', () => {
    const html = render({
      checklist: [item('terms', true)],
      error: 'Ainda falta completar a checklist para continuar.',
    })

    expect(html).toContain('role="alert"')
    expect(html).toContain('Ainda falta completar a checklist')
  })

  it('recusado: "Ajustes necessários" com o motivo, progresso e "Corrigir e reenviar"', () => {
    const html = render({
      business: {
        ...draft,
        verificationLevel: 'Rejected',
        category: 'Saude',
        reason: 'Registro do conselho não confere.',
      },
      checklist: [item('terms', true), item('responsible', true)],
    })

    expect(html).toContain('Ajustes necessários · não aparece na busca')
    expect(html).toContain('Registro do conselho não confere.')
    expect(html).toContain('2 de 2 concluídos')
    expect(html).toContain('Corrigir e reenviar')
    expect(html).not.toContain('Dispensar')
  })

  it('em análise: diz que não há nada a fazer, mostra o progresso e não tem botão de ação', () => {
    const html = render({
      business: {
        ...draft,
        status: 'PendingReview',
        verificationLevel: 'UnderReview',
        category: 'Saude',
      },
      checklist: [item('terms', true), item('responsible', true)],
    })

    expect(html).toContain('Em análise · ainda não aparece na busca')
    expect(html).toContain('nada a fazer agora')
    expect(html).toContain('2 de 2 concluídos')
    expect(html).not.toContain('Continuar verificação')
    expect(html).not.toContain('Enviar para análise')
  })

  it('suspenso: mostra o motivo, orienta a falar com o suporte e não oferece ação', () => {
    const html = render({
      business: {
        ...draft,
        status: 'Suspended',
        verificationLevel: 'Verified',
        reason: 'Denúncia procedente.',
      },
    })

    expect(html).toContain('Suspenso · não aparece na busca')
    expect(html).toContain('Denúncia procedente.')
    expect(html).toContain('fale com o suporte')
    expect(html).not.toContain('<button')
  })

  it('ativo: "Verificado" com "Dispensar" só no primeiro acesso; depois some', () => {
    const active = { ...draft, status: 'Active', verificationLevel: 'Verified' } as const
    const shown = render({ business: active, showApproved: true })

    expect(shown).toContain('Verificado · o estabelecimento aparece na busca')
    expect(shown).toContain('Dispensar')
    expect(render({ business: active, showApproved: false })).toBe('')
  })
})

describe('passo guiado', () => {
  const checklist = [
    item('terms', true),
    item('professional', false),
    item('service_with_professional', false),
    item('work_schedule', false),
  ]
  const guide = { key: 'service_with_professional', onExit: noop }

  it('stepOf numera o item pendente entre os obrigatórios e some quando ele é concluído', () => {
    expect(stepOf(checklist, 'service_with_professional')).toEqual({ number: 3, total: 4 })
    expect(stepOf(checklist, 'terms')).toBeUndefined() // já feito: o passo acabou
    expect(stepOf(checklist, 'chave_nova')).toBeUndefined()
  })

  it('nextPendingKey anda pelos pendentes, volta ao começo e não inventa um próximo se só resta um', () => {
    expect(nextPendingKey(checklist, 'professional')).toBe('service_with_professional')
    expect(nextPendingKey(checklist, 'work_schedule')).toBe('professional')
    expect(nextPendingKey([item('professional', false)], 'professional')).toBeUndefined()
  })

  it('mostra "Passo N de T", o progresso e só navega: sem "Continuar verificação" nem chevron', () => {
    const html = render({ checklist, guide })

    expect(html).toContain('Passo 3 de 4 · serviço com profissional habilitado')
    expect(html).toContain('Designe quem executa o serviço destacado abaixo.')
    expect(html).toContain('1 de 4 concluídos')
    expect(html).toContain('Voltar à lista')
    expect(html).toContain('Próximo pendente')
    expect(html).not.toContain('Continuar verificação')
    expect(html).not.toContain('aria-expanded')
  })

  it('com um único pendente, "Próximo pendente" não aparece (sem botão morto)', () => {
    const html = render({
      checklist: [item('terms', true), item('service_with_professional', false)],
      guide,
    })

    expect(html).toContain('Voltar à lista')
    expect(html).not.toContain('Próximo pendente')
  })

  it('item concluído, checklist carregando ou fora do rascunho: a faixa volta ao normal', () => {
    const done = render({ checklist: [item('service_with_professional', true)], guide })
    const loading = render({ checklist: undefined, guide })
    const review = render({
      business: { ...draft, status: 'PendingReview', verificationLevel: 'UnderReview' },
      guide,
    })

    expect(done).not.toContain('Passo')
    expect(loading).toContain('Conferindo o que falta')
    expect(review).toContain('Em análise')
    expect(review).not.toContain('Voltar à lista')
  })
})
