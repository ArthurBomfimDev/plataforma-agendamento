import { describe, expect, it } from 'vitest'

import { AGENDA_VERTICALS, ROW_HEIGHT } from './consts'
import { AgendaRail } from '.'
import { renderToString } from 'react-dom/server'

const html = (activeId = 'barbershop') =>
  renderToString(<AgendaRail verticals={AGENDA_VERTICALS} activeId={activeId} />).replaceAll(
    '<!-- -->',
    '',
  )

describe('AgendaRail', () => {
  it('é decorativa: fica fora da árvore de acessibilidade', () => {
    expect(html()).toMatch(/^<div aria-hidden="true"/)
  })

  it('mostra só o vertical ativo', () => {
    const page = html('nails')

    expect(page.match(/data-vertical=/g)).toHaveLength(1)
    expect(page).toContain('data-vertical="nails"')
    expect(page).toContain('Studio Lins Nails')
  })

  it('cada vertical tem seis linhas, um vão livre e a própria contagem', () => {
    for (const { id, hours, slots, freeToday } of AGENDA_VERTICALS) {
      expect(hours).toHaveLength(6)
      expect(slots).toHaveLength(6)
      expect(slots.filter(({ kind }) => kind === 'free')).toHaveLength(1)
      expect(html(id)).toContain(`${freeToday} horários livres hoje`)
    }
  })

  it('a linha do agora fica no topo da linha do vão livre', () => {
    expect(html('barbershop')).toContain(`top:${2 * ROW_HEIGHT - 4}px`)
    expect(html('nails')).toContain(`top:${1 * ROW_HEIGHT - 4}px`)
  })
})
