import { describe, expect, it } from 'vitest'

import { ChooseProfessionalScreen } from '.'
import { MemoryRouter } from 'react-router'
import { renderToString } from 'react-dom/server'

// O React separa trechos de texto com `<!-- -->` no HTML do servidor; tiramos para comparar o texto.
const render = (element: React.ReactElement) =>
  renderToString(<MemoryRouter>{element}</MemoryRouter>).replaceAll('<!-- -->', '')

describe('ChooseProfessionalScreen', () => {
  it('resume o serviço e lista "Sem preferência" antes dos profissionais', () => {
    const html = render(
      <ChooseProfessionalScreen businessId="estudio-duartina" serviceId="corte-masculino" />,
    )

    expect(html).toContain('Corte masculino · 30 min · R$')
    expect(html).toContain('45,00')
    expect(html.indexOf('Sem preferência')).toBeLessThan(html.indexOf('Marina Souza'))
    expect(html).toContain('Colorimetria · 6 anos')
    expect(html).toContain('★ 4,8 · ver perfil')
  })

  it('expõe cada opção como botão', () => {
    const html = render(
      <ChooseProfessionalScreen businessId="estudio-duartina" serviceId="corte-masculino" />,
    )

    expect(html.match(/<button[^>]*type="button"/g)).toHaveLength(5) // voltar + 4 opções
  })

  it('cai na página 404 quando o serviço não existe no estabelecimento', () => {
    const html = render(<ChooseProfessionalScreen businessId="estudio-duartina" serviceId="x" />)

    expect(html).toContain('Página não encontrada')
  })
})
