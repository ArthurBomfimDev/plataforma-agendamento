import { describe, expect, it } from 'vitest'

import type { ChecklistItemResponse } from '@api/models'
import { VerificationIntroContent } from '.'
import { renderToString } from 'react-dom/server'

const item = (key: string, done: boolean): ChecklistItemResponse => ({
  key,
  done,
  requiredForSubmit: true,
})
const noop = () => undefined

const items = [
  item('terms', false),
  item('document', true),
  item('location_confirmed', false),
  item('professional', false),
  item('service_with_professional', false),
  item('work_schedule', false),
]

const render = (list = items) =>
  renderToString(
    <VerificationIntroContent items={list} onStart={noop} onLater={noop} />,
  ).replaceAll('<!-- -->', '')

describe('VerificationIntroContent', () => {
  it('conta o que falta no título e explica que o estabelecimento não aparece na busca', () => {
    const html = render()

    expect(html).toContain('Faltam 5 passos para você aparecer na busca')
    expect(html).toContain('nenhum consumidor consegue encontrá-lo nem agendar')
    expect(html).not.toContain('cliente')
  })

  it('lista todos os itens, com o feito em texto (não só na cor) e o progresso em segmentos', () => {
    const html = render()

    expect(html).toContain('Aceitar os termos de uso e a política de privacidade')
    expect(html).toContain('Documento informado')
    expect(html).toContain(' (feito)')
    expect(html.match(/ \(falta\)/g)).toHaveLength(5)
    expect(html).toContain('1 de 6 concluídos')
    expect(html.match(/data-segment="done"/g)).toHaveLength(1)
    expect(html.match(/data-segment="pending"/g)).toHaveLength(5)
  })

  it('oferece começar agora ou deixar para depois, e diz que o aviso aparece só uma vez', () => {
    const html = render()

    expect(html).toContain('Começar pelo primeiro item')
    expect(html).toContain('Deixar para depois')
    expect(html).toContain('aparece só neste primeiro acesso')
  })

  it('falta um só: o título fica no singular', () => {
    const html = render([item('terms', true), item('professional', false)])

    expect(html).toContain('Falta 1 passo para você aparecer na busca')
  })
})
