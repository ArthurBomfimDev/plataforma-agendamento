import type { PhotosData, PhotosScreenProps } from './types'
import { describe, expect, it } from 'vitest'

import { PhotosScreen } from '.'
import { renderToString } from 'react-dom/server'

const IMAGE = { small: '/a.webp', medium: '/b.webp', large: '/c.webp' }

const ready: PhotosData = {
  status: 'ready',
  logo: null,
  cover: null,
  professionals: [
    {
      id: 'p1',
      name: 'Marina Souza',
      specialty: 'Cabeleireira',
      photo: IMAGE,
      isPubliclyVisible: true,
    },
    {
      id: 'p2',
      name: 'Rafael Lima',
      specialty: 'Barbeiro',
      photo: IMAGE,
      isPubliclyVisible: false,
    },
    { id: 'p3', name: 'Carla Nunes', specialty: null, photo: null, isPubliclyVisible: true },
  ],
}

const upload = () => async () => null
const remove = () => async () => undefined

const render = (overrides: Partial<PhotosScreenProps> = {}) =>
  renderToString(
    <PhotosScreen
      data={ready}
      businessName="Estúdio Duartina"
      onUploadBusiness={upload}
      onRemoveBusiness={remove}
      onUploadProfessional={upload}
      onRemoveProfessional={remove}
      {...overrides}
    />,
  ).replaceAll('<!-- -->', '')

describe('PhotosScreen', () => {
  it('oferece logotipo, capa e a foto de cada profissional', () => {
    const html = render()

    expect(html).toContain('Logotipo · quadrado')
    expect(html).toContain('Capa · 3:1, cortada no centro')
    expect(html).toContain('Imagens do estabelecimento')
    expect(html).toContain('Cabeleireira')
    expect(html).toContain('Marina Souza')
    expect(html).toContain('Rafael Lima')
  })

  it('diz onde cada foto aparece: só com perfil completo (consentimento)', () => {
    const html = render()

    expect(html).toContain('depende do consentimento')
    expect(html).toContain('Aparece na página pública')
    expect(html).toContain(
      'Guardada: só aparece na página pública com o perfil completo (consentimento).',
    )
    expect(html).toContain('Sem foto — aparece com as iniciais')
  })

  it('sem profissional ativo, manda cadastrar a equipe', () => {
    expect(render({ data: { ...ready, professionals: [] } })).toContain(
      'Nenhum profissional ativo.',
    )
  })

  it('mostra o carregando e o erro com "Tentar de novo"', () => {
    expect(render({ data: { status: 'loading' } })).toContain('Carregando as imagens…')

    const html = render({
      data: { status: 'error', message: 'Sem conexão com o servidor.', onRetry: () => undefined },
    })
    expect(html).toContain('Sem conexão com o servidor.')
    expect(html).toContain('Tentar de novo')
    expect(html).not.toContain('Logotipo')
  })
})
