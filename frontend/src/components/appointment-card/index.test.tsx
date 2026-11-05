import { describe, expect, it } from 'vitest'

import { AppointmentCard } from '.'
import type { AppointmentCardProps } from './types'
import { renderToString } from 'react-dom/server'

const render = (patch: Partial<AppointmentCardProps> = {}) =>
  renderToString(
    <AppointmentCard
      businessName="Estúdio Duartina"
      status="confirmed"
      summary="Corte · sex, 11 set · 09:30"
      serviceLine="Corte · 30 min"
      whenLine="sex, 11 set · 09:30 — 10:00"
      {...patch}
    />,
  )

describe('AppointmentCard', () => {
  it('com foto: mostra a imagem do estabelecimento', () => {
    const image = {
      small: 'businesses/b1/k-s.webp',
      medium: 'businesses/b1/k-m.webp',
      large: 'businesses/b1/k-l.webp',
    }

    expect(render({ image, category: 'Beleza' })).toMatch(/<img[^>]*businesses\/b1\/k-/)
  })

  it('sem foto: a ilustração da categoria, e não o quadrado cinza', () => {
    const html = render({ image: null, category: 'Saude' })

    expect(html).toContain('data-category="Saude"')
    expect(html).not.toContain('bg-(--bg-disabled)')
  })
})
