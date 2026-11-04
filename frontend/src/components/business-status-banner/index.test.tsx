import { bannerState, labelOf, missingItems } from './consts'
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

const render = (overrides: Partial<BusinessStatusBannerProps> = {}) =>
  renderToString(
    <BusinessStatusBanner
      business={{
        status: 'Draft',
        verificationLevel: 'Unverified',
        category: 'Beleza',
        reason: null,
      }}
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
  it('rascunho com itens faltando: mostra o que falta com atalho e NENHUM botão de publicar', () => {
    const html = render()

    expect(html).toContain('Rascunho')
    expect(html).toContain('Cadastrar ao menos 1 profissional')
    expect(html).toContain('(falta)')
    expect(html).toContain('(feito)')
    expect(html).toContain('Resolver')
    expect(html).not.toContain('Publicar meu estabelecimento')
    expect(html).not.toContain('Enviar para análise')
  })

  it('checklist completa: Beleza publica; Saúde envia para análise', () => {
    const done = [item('terms', true), item('professional', true)]

    expect(render({ checklist: done })).toContain('Publicar meu estabelecimento')
    expect(
      render({
        checklist: done,
        business: {
          status: 'Draft',
          verificationLevel: 'Unverified',
          category: 'Saude',
          reason: null,
        },
      }),
    ).toContain('Enviar para análise')
    expect(
      render({
        checklist: done,
        business: {
          status: 'Draft',
          verificationLevel: 'Unverified',
          category: 'Saude',
          reason: 'x',
        },
      }),
    ).not.toContain('Reenviar')
  })

  it('carregando a checklist: "Conferindo o que falta…" e nenhum botão', () => {
    const html = render({ checklist: undefined })

    expect(html).toContain('Conferindo o que falta')
    expect(html).not.toContain('Publicar meu estabelecimento')
  })

  it('erro ao buscar a checklist: mensagem e "Tentar de novo"', () => {
    const html = render({ checklist: undefined, checklistError: 'Sem conexão com o servidor.' })

    expect(html).toContain('Sem conexão com o servidor.')
    expect(html).toContain('Tentar de novo')
  })

  it('erro ao publicar aparece na faixa, com role="alert"', () => {
    const html = render({
      checklist: [item('terms', true)],
      error: 'Ainda falta completar a checklist para continuar.',
    })

    expect(html).toContain('role="alert"')
    expect(html).toContain('Ainda falta completar a checklist')
  })

  it('reprovado: mostra o motivo e permite reenviar (Saúde) depois de corrigir', () => {
    const html = render({
      business: {
        status: 'Draft',
        verificationLevel: 'Rejected',
        category: 'Saude',
        reason: 'Registro do conselho não confere.',
      },
      checklist: [item('terms', true), item('responsible', true)],
    })

    expect(html).toContain('Reprovado')
    expect(html).toContain('Motivo: Registro do conselho não confere.')
    expect(html).toContain('Corrija o que foi apontado')
    expect(html).toContain('Reenviar para análise')
  })

  it('em análise: diz o que já pode e o que está bloqueado, sem botões', () => {
    const html = render({
      business: {
        status: 'PendingReview',
        verificationLevel: 'UnderReview',
        category: 'Saude',
        reason: null,
      },
    })

    expect(html).toContain('Em análise')
    expect(html).toContain('configurar serviços, equipe')
    expect(html).toContain('Ainda bloqueado: aparecer na busca e receber pedidos.')
    expect(html).not.toContain('<button')
  })

  it('suspenso: mostra o motivo e não oferece ação', () => {
    const html = render({
      business: {
        status: 'Suspended',
        verificationLevel: 'Verified',
        category: 'Beleza',
        reason: 'Denúncia procedente.',
      },
    })

    expect(html).toContain('Suspenso')
    expect(html).toContain('Motivo: Denúncia procedente.')
    expect(html).not.toContain('<button')
  })

  it('ativo: só mostra "Aprovado" no primeiro acesso, com "Entendi"; depois some', () => {
    const active = {
      status: 'Active',
      verificationLevel: 'Verified',
      category: 'Beleza',
      reason: null,
    } as const

    expect(render({ business: active, showApproved: true })).toContain('Entendi')
    expect(render({ business: active, showApproved: false })).toBe('')
  })
})
