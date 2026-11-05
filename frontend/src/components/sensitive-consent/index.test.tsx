import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '@api/base'
import { grantAndResend, isConsentRequired } from '@api/services/consent'

import { SensitiveConsent, type SensitiveConsentProps } from '.'
import { renderToString } from 'react-dom/server'

const render = (patch: Partial<SensitiveConsentProps> = {}) =>
  renderToString(
    <SensitiveConsent
      text={{ status: 'ready', value: 'Autorizo o tratamento dos dados.' }}
      busy={false}
      onAccept={() => undefined}
      {...patch}
    />,
  ).replaceAll('<!-- -->', '')

describe('SensitiveConsent', () => {
  it('mostra o texto, a caixa desmarcada e o botão', () => {
    const html = render()

    expect(html).toContain('Autorizo o tratamento dos dados.')
    expect(html).toContain('Li e dou o meu consentimento')
    expect(html).toContain('Dar consentimento e continuar')
    expect(html).not.toContain('aria-checked="true"')
  })

  it('carregando: sem texto, não há como consentir', () => {
    const html = render({ text: { status: 'loading' } })

    expect(html).toContain('Carregando o texto')
    expect(html).not.toContain('Dar consentimento e continuar')
  })

  it('erro ao buscar o texto: não deixa consentir sem ler', () => {
    const html = render({
      text: { status: 'error', message: 'Sem conexão.', onRetry: () => undefined },
    })

    expect(html).toContain('Sem conexão.')
    expect(html).toContain('Tentar de novo')
    expect(html).not.toContain('Dar consentimento e continuar')
  })

  it('erro ao gravar aparece no bloco, como alerta', () => {
    const html = render({ error: 'O texto do consentimento mudou.' })

    expect(html).toContain('role="alert"')
    expect(html).toContain('O texto do consentimento mudou.')
  })
})

describe('fluxo do consentimento', () => {
  it('reconhece a recusa do servidor pelo código', () => {
    expect(isConsentRequired(new ApiError(403, 'compliance.consent_required'))).toBe(true)
    expect(isConsentRequired(new ApiError(403, 'auth.forbidden'))).toBe(false)
    expect(isConsentRequired(new Error('rede'))).toBe(false)
  })

  it('depois de consentir, reenvia o pedido', async () => {
    const order: string[] = []

    await grantAndResend(
      async () => order.push('grava'),
      () => order.push('reenvia'),
    )

    expect(order).toEqual(['grava', 'reenvia'])
  })

  it('se gravar falhar, não reenvia', async () => {
    const resend = vi.fn()

    await expect(
      grantAndResend(async () => {
        throw new Error('falhou')
      }, resend),
    ).rejects.toThrow('falhou')
    expect(resend).not.toHaveBeenCalled()
  })
})
