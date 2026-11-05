import { describe, expect, it } from 'vitest'

import { DocumentStep } from '.'
import { renderToString } from 'react-dom/server'

const render = (props: Partial<Parameters<typeof DocumentStep>[0]> = {}) =>
  renderToString(
    <DocumentStep
      type="Cnpj"
      value=""
      isMei={false}
      onTypeChange={() => undefined}
      onChange={() => undefined}
      onMeiChange={() => undefined}
      {...props}
    />,
  ).replaceAll('<!-- -->', '')

describe('DocumentStep', () => {
  it('com CNPJ, o campo se chama CNPJ e "Sou MEI" aparece', () => {
    const html = render()

    expect(html).toMatch(/<label[^>]*>CNPJ<\/label>/)
    expect(html).toContain('Sou MEI')
  })

  it('com CPF, o campo se chama CPF e "Sou MEI" some: MEI só existe com CNPJ', () => {
    const html = render({ type: 'Cpf' })

    expect(html).toMatch(/<label[^>]*>CPF<\/label>/)
    expect(html).not.toContain('Sou MEI')
  })

  it('o texto de ajuda fala do CNPJ nos dois tipos, e o erro aparece no campo', () => {
    const html = render({ type: 'Cpf', error: 'Informe o CPF.' })

    expect(html).toContain('Portal do Empreendedor')
    expect(html).toContain('Informe o CPF.')
    expect(html).toContain('aria-invalid="true"')
  })
})
