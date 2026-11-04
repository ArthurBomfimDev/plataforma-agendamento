import { describe, expect, it } from 'vitest'

import { ImageUploader } from '.'
import { ImageUploaderView } from './view'
import type { ImageUploaderViewProps } from './types'
import { renderToString } from 'react-dom/server'
import { validateImageFile } from './consts'

const view = (props: Partial<ImageUploaderViewProps> = {}) =>
  renderToString(
    <ImageUploaderView
      id="logo"
      label="Logotipo"
      shape="square"
      preview={<span>previa</span>}
      hasImage={false}
      status="idle"
      progress={0}
      canRemove
      {...props}
    />,
  ).replaceAll('<!-- -->', '')

describe('ImageUploaderView', () => {
  it('sem imagem: grupo rotulado, ajuda ligada ao botão, sem remover', () => {
    const page = view()

    expect(page).toMatch(/role="group" aria-labelledby="logo-label"/)
    expect(page).toContain('Escolher imagem')
    expect(page).toContain('aria-describedby="logo-help"')
    expect(page).toContain('JPEG, PNG ou WebP · até 5 MB')
    expect(page).not.toContain('Remover')
  })

  it('com imagem: trocar e remover', () => {
    const page = view({ hasImage: true })

    expect(page).toContain('Trocar')
    expect(page).toContain('Remover')
  })

  it('enviando: barra de progresso acessível e botões desligados', () => {
    const page = view({ status: 'uploading', progress: 0.42, hasImage: true, fileName: 'logo.png' })

    expect(page).toMatch(/role="progressbar"[^>]*aria-valuenow="42"/)
    expect(page).toContain('aria-valuetext="Enviando, 42%"')
    expect(page).toContain('width:42%')
    expect(page).toMatch(/disabled=""[^>]*>.*Trocar/s)
    expect(page).toContain('logo.png · 42%')
  })

  it('erro em alerta com título, mensagem e dica, também ligado ao botão', () => {
    const page = view({
      problem: {
        title: 'Arquivo grande demais',
        message: 'capa.png tem 8,4 MB. O limite é 5 MB.',
        hint: 'Tente exportar em qualidade menor.',
      },
    })

    expect(page).toMatch(/role="alert"/)
    expect(page).toContain('Arquivo grande demais')
    expect(page).toContain('capa.png tem 8,4 MB. O limite é 5 MB.')
    expect(page).toContain('Tente exportar em qualidade menor.')
    expect(page).toContain('aria-describedby="logo-help logo-error"')
  })

  it('salvo: anúncio na região viva', () => {
    expect(view({ status: 'done', hasImage: true })).toMatch(
      /aria-live="polite"[^>]*>Imagem salva\./,
    )
  })
})

describe('ImageUploader', () => {
  it('o seletor de arquivo fica escondido, fora da tabulação, só com os tipos aceitos', () => {
    const page = renderToString(
      <ImageUploader
        id="capa"
        label="Capa"
        current={null}
        fallback={<span>ilustracao</span>}
        onUpload={async () => null}
      />,
    )

    expect(page).toMatch(/type="file"[^>]*accept="image\/jpeg,image\/png,image\/webp"/)
    expect(page).toContain('tabindex="-1"')
    expect(page).toContain('ilustracao')
  })
})

describe('validateImageFile', () => {
  const file = (type: string, size: number, name = 'foto.png') => ({ name, type, size })

  it('aceita JPEG, PNG e WebP até 5 MB', () => {
    expect(validateImageFile(file('image/png', 1000))).toBeUndefined()
    expect(validateImageFile(file('image/webp', 5 * 1024 * 1024))).toBeUndefined()
  })

  it('recusa SVG e outros tipos, com a mensagem do Figma 19b', () => {
    expect(validateImageFile(file('image/svg+xml', 10))).toEqual({
      title: 'Formato não aceito',
      message: 'Aceitamos JPEG, PNG e WebP. SVG não é aceito.',
      hint: 'Conferimos o conteúdo do arquivo, não a extensão.',
    })
    expect(validateImageFile(file('application/pdf', 10))?.title).toBe('Formato não aceito')
  })

  it('recusa arquivo grande dizendo o nome, o tamanho e o limite', () => {
    expect(
      validateImageFile(file('image/png', Math.round(8.4 * 1024 * 1024), 'capa-estudio.png')),
    ).toEqual({
      title: 'Arquivo grande demais',
      message: 'capa-estudio.png tem 8,4 MB. O limite é 5 MB.',
      hint: 'Tente exportar em qualidade menor ou escolher outra imagem.',
    })
    expect(validateImageFile(file('image/jpeg', 5 * 1024 * 1024 + 1))?.title).toBe(
      'Arquivo grande demais',
    )
  })

  it('recusa arquivo vazio', () => {
    expect(validateImageFile(file('image/jpeg', 0))?.title).toBe('Arquivo vazio')
  })
})
