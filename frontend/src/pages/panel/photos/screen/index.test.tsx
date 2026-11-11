import type { PhotosData, PhotosScreenProps } from './types'
import { describe, expect, it } from 'vitest'

import { PhotosScreen } from '.'
import { renderToString } from 'react-dom/server'

const IMAGE = { small: '/a.webp', medium: '/b.webp', large: '/c.webp' }

const ready: PhotosData = {
  status: 'ready',
  logo: null,
  photos: [IMAGE, { small: '/d.webp', medium: '/e.webp', large: '/f.webp' }],
  professionals: [
    { id: 'p1', name: 'Marina Souza', specialty: 'Cabeleireira', photo: IMAGE },
    { id: 'p2', name: 'Rafael Lima', specialty: 'Barbeiro', photo: IMAGE },
    { id: 'p3', name: 'Carla Nunes', specialty: null, photo: null },
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
      onUploadShowcase={upload}
      onRemoveShowcase={remove}
      onReorderShowcase={async () => undefined}
      onUploadProfessional={upload}
      onRemoveProfessional={remove}
      {...overrides}
    />,
  ).replaceAll('<!-- -->', '')

describe('PhotosScreen', () => {
  it('oferece logotipo, a vitrine e a foto de cada profissional', () => {
    const html = render()

    expect(html).toContain('Logotipo · quadrado')
    expect(html).toContain('Vitrine · até 3 fotos')
    expect(html).toContain('Logotipo do estabelecimento')
    expect(html).toContain('Cabeleireira')
    expect(html).toContain('Marina Souza')
    expect(html).toContain('Rafael Lima')
  })

  it('a vitrine mostra a capa, a segunda foto e um lugar vazio para a terceira, com os botões de mover', () => {
    const html = render()

    expect(html).toContain('Capa')
    expect(html).toContain('Foto 2')
    expect(html).toContain('Foto 3')
    expect(html).toContain('Mover a foto 2 para a esquerda')
    expect(html).toContain('Mover a capa para a direita')
  })

  it('sem foto nenhuma, a vitrine oferece só o primeiro lugar e nenhum botão de mover', () => {
    const html = render({ data: { ...ready, photos: [] } })

    expect(html).toContain('Capa')
    expect(html).not.toContain('Foto 2')
    expect(html).not.toContain('Mover a')
  })

  it('diz onde cada foto aparece: na página pública, sem depender de consentimento por perfil', () => {
    const html = render()

    expect(html).toContain('Aparece na página pública')
    expect(html).toContain('Sem foto — aparece com as iniciais')
    expect(html).not.toContain('consentimento')
    expect(html).not.toContain('Guardada')
  })

  it('para quem não tem login, lembra da declaração do dono', () => {
    expect(render()).toContain('declaração de autorização')
  })

  it('sem profissional ativo, manda cadastrar a equipe', () => {
    expect(render({ data: { ...ready, professionals: [] } as PhotosData })).toContain(
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
