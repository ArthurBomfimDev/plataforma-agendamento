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
    expect(page).toContain('JPEG, PNG ou WebP, até 5 MB.')
    expect(page).not.toContain('Remover')
  })

  it('com imagem: trocar e remover', () => {
    const page = view({ hasImage: true })

    expect(page).toContain('Trocar imagem')
    expect(page).toContain('Remover')
  })

  it('enviando: barra de progresso acessível e botões desligados', () => {
    const page = view({ status: 'uploading', progress: 0.42, hasImage: true })

    expect(page).toMatch(/role="progressbar"[^>]*aria-valuenow="42"/)
    expect(page).toContain('aria-valuetext="Enviando, 42%"')
    expect(page).toContain('width:42%')
    expect(page).toMatch(/disabled=""[^>]*>.*Trocar imagem/s)
  })

  it('erro em alerta, também ligado ao botão', () => {
    const page = view({ error: 'A imagem passa de 5 MB. Escolha uma menor.' })

    expect(page).toMatch(/role="alert"[^>]*>A imagem passa de 5 MB/)
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
  it('aceita JPEG, PNG e WebP até 5 MB', () => {
    expect(validateImageFile({ type: 'image/png', size: 1000 })).toBeUndefined()
    expect(validateImageFile({ type: 'image/webp', size: 5 * 1024 * 1024 })).toBeUndefined()
  })

  it('recusa SVG, outros tipos, arquivo grande e vazio', () => {
    expect(validateImageFile({ type: 'image/svg+xml', size: 10 })).toBe(
      'Escolha uma imagem JPEG, PNG ou WebP.',
    )
    expect(validateImageFile({ type: 'application/pdf', size: 10 })).toBeDefined()
    expect(validateImageFile({ type: 'image/jpeg', size: 5 * 1024 * 1024 + 1 })).toBe(
      'A imagem passa de 5 MB. Escolha uma menor.',
    )
    expect(validateImageFile({ type: 'image/jpeg', size: 0 })).toBe('O arquivo está vazio.')
  })
})
