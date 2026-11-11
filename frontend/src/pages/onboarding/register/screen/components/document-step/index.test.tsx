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

  it('mostra o documento com máscara e usa o teclado certo para cada tipo', () => {
    const cpf = render({ type: 'Cpf', value: '12345678909' })
    const cnpj = render({ type: 'Cnpj', value: '12345678901234' })

    expect(cpf).toContain('value="123.456.789-09"')
    expect(cpf).toContain('inputMode="numeric"')
    expect(cnpj).toContain('value="12.345.678/9012-34"')
    // CNPJ alfanumérico (IN RFB 2.229/2024): letras nas 12 primeiras posições pedem teclado de texto.
    expect(cnpj).toContain('inputMode="text"')
  })

  it('o texto de ajuda fala do CNPJ nos dois tipos, e o erro aparece no campo', () => {
    const html = render({ type: 'Cpf', error: 'Informe o CPF.' })

    expect(html).toContain('Portal do Empreendedor')
    expect(html).toContain('Informe o CPF.')
    expect(html).toContain('aria-invalid="true"')
  })
})
