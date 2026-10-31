import type { PhotosData, PhotosScreenProps } from './types'
import { describe, expect, it } from 'vitest'

import { PhotosScreen } from '.'
import { renderToString } from 'react-dom/server'

const ready: PhotosData = {
  status: 'ready',
  logo: null,
  cover: null,
  professionals: [
    { id: 'p1', name: 'Marina Souza', photo: null, isPubliclyVisible: true },
    { id: 'p2', name: 'Rafael Lima', photo: null, isPubliclyVisible: false },
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

    expect(html).toContain('Logotipo')
    expect(html).toContain('Capa')
    expect(html).toContain('Marina Souza')
    expect(html).toContain('Rafael Lima')
  })

  it('diz de quem a foto aparece na vitrine: só com perfil completo (consentimento)', () => {
    const html = render()

    expect(html).toContain('precisa do consentimento')
    expect(html).toContain('Aparece na vitrine.')
    expect(html).toContain('Não aparece na vitrine: sem perfil completo (consentimento).')
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
