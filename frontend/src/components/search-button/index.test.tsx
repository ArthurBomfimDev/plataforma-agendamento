import { describe, expect, it } from 'vitest'

import { SearchButton } from '.'
import { renderToString } from 'react-dom/server'

const html = (props: Parameters<typeof SearchButton>[0] = {}) =>
  renderToString(<SearchButton {...props} />).replaceAll('<!-- -->', '')

describe('SearchButton', () => {
  it('é o botão primário de envio, com foco visível e alvo de toque', () => {
    const page = html()

    expect(page).toContain('type="submit"')
    expect(page).toContain('bg-(--action-primary)')
    expect(page).toContain('min-h-(--size-touch-min)')
    expect(page).toContain('focus-visible:outline-(--border-focus)')
    expect(page).toMatch(/>Buscar<\/button>/)
  })

  it('carregando: desligado e ocupado', () => {
    const page = html({ loading: true })

    expect(page).toContain('disabled=""')
    expect(page).toContain('aria-busy="true"')
    expect(page).toContain('animate-spin')
  })

  it('desligado sem carregar não anuncia ocupado', () => {
    const page = html({ disabled: true })

    expect(page).toContain('disabled=""')
    expect(page).not.toContain('aria-busy')
  })
})
