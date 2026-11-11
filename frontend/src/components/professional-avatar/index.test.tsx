import { describe, expect, it } from 'vitest'

import type { ImageSet } from '@api/models'
import { ProfessionalAvatar } from '.'
import type { ReactElement } from 'react'

const photo: ImageSet = {
  small: '/media/p/1-s.webp',
  medium: '/media/p/1-m.webp',
  large: '/media/p/1-l.webp',
}

/** O componente só repassa props ao `Avatar`: o elemento devolvido mostra o que ele decidiu. */
const props = (element: ReactElement) => element.props as Record<string, unknown>

describe('ProfessionalAvatar', () => {
  it('com foto, usa o arquivo pequeno até 56 px, resolvido pela camada de mídia', () => {
    for (const size of ['sm', 'md', 'lg'] as const) {
      const { src } = props(ProfessionalAvatar({ name: 'Ana Souza', photo, size }))

      expect(src).toMatch(/\/media\/p\/1-s\.webp$/)
    }
  })

  it('em 80 px, usa o arquivo médio', () => {
    expect(props(ProfessionalAvatar({ name: 'Ana Souza', photo, size: 'xl' })).src).toMatch(
      /\/media\/p\/1-m\.webp$/,
    )
  })

  it('sem foto, sem src e com as iniciais', () => {
    for (const noPhoto of [null, undefined]) {
      const shown = props(ProfessionalAvatar({ name: 'Ana Souza', photo: noPhoto }))

      expect(shown.src).toBeUndefined()
      expect(shown.initials).toBe('AS')
    }
  })

  it('a foto sempre leva as iniciais junto, para o caso de a imagem falhar', () => {
    expect(props(ProfessionalAvatar({ name: 'Ana Souza', photo })).initials).toBe('AS')
  })

  it('é decorativo: o nome já está escrito ao lado', () => {
    expect(props(ProfessionalAvatar({ name: 'Ana Souza', photo })).alt).toBe('')
  })
})
