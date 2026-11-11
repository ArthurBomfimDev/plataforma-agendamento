import { describe, expect, it } from 'vitest'

import { AddToCalendarMenu } from '.'
import { CALENDAR_OPTIONS } from './consts'
import { renderToString } from 'react-dom/server'

describe('AddToCalendarMenu', () => {
  it('mostra o botão "Adicionar à agenda"; as opções abrem no menu (portal, só no navegador)', () => {
    const html = renderToString(<AddToCalendarMenu onSelect={() => undefined} />)

    expect(html).toContain('Adicionar à agenda')
  })

  it('oferece Google, Outlook e o arquivo .ics, nessa ordem', () => {
    expect(CALENDAR_OPTIONS.map(({ target }) => target)).toEqual(['google', 'outlook', 'ics'])
    expect(CALENDAR_OPTIONS.map(({ label }) => label)).toEqual([
      'Google Agenda',
      'Outlook',
      'Apple e outros (arquivo .ics)',
    ])
  })
})
