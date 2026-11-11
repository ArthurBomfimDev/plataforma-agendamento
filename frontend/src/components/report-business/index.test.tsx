import { REPORT_MAX_LENGTH, ReportBusiness, reasonError } from '.'
import { describe, expect, it } from 'vitest'

import { renderToString } from 'react-dom/server'

describe('reasonError', () => {
  it('pede de 5 a 500 caracteres, contando sem os espaços das pontas', () => {
    expect(reasonError('  ab  ')).toContain('pelo menos 5')
    expect(reasonError('')).toContain('pelo menos 5')
    expect(reasonError('curto')).toBeUndefined()
    expect(reasonError('x'.repeat(REPORT_MAX_LENGTH))).toBeUndefined()
    expect(reasonError('x'.repeat(REPORT_MAX_LENGTH + 1))).toContain('até 500')
  })
})

describe('ReportBusiness', () => {
  it('começa fechado: só o botão "Denunciar este estabelecimento", sem campo', () => {
    const html = renderToString(<ReportBusiness onSubmit={async () => null} />)

    expect(html).toContain('Denunciar este estabelecimento')
    expect(html).not.toContain('<input')
    expect(html).not.toContain('role="alert"')
  })
})
