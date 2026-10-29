import { ACCEPT_ATTRIBUTE, validateImageFile } from './consts'
import type { ImageUploaderProps, UploadStatus } from './types'
import { useRef, useState } from 'react'

import { ImageUploaderView } from './view'
import { SmartImage } from '@components/smart-image'
import { errorMessage } from '@lib/api/errors'
import { useObjectUrl } from '@hooks/use-object-url'

/**
 * Envio de imagem (Onda 6D): escolher arquivo, pré-visualizar, enviar com barra de progresso, remover. Por teclado
 * e por leitor de tela: o botão abre o seletor do sistema; o `<input type="file">` fica escondido e fora da ordem
 * de tabulação; progresso, resultado e erro são anunciados.
 *
 * Feito para o painel do estabelecimento (logotipo, capa, foto do profissional), que mora na branch `dashboard`.
 * Como plugar: `docs/produto/contrato-api-frontend.md` §4.5.
 */
export const ImageUploader = (props: ImageUploaderProps) => {
  const { id, label, current, fallback, shape = 'cover', onUpload, onRemove, disabled } = props
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<File | null>(null)
  const [image, setImage] = useState(current)
  const [lastCurrent, setLastCurrent] = useState(current)

  // A tela recarregou a imagem da API: ela manda. Ajustado na renderização, sem efeito.
  if (current !== lastCurrent) {
    setLastCurrent(current)
    setImage(current)
  }
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string>()
  const previewUrl = useObjectUrl(pending)

  const choose = async (file: File | undefined) => {
    if (!file) return
    const invalid = validateImageFile(file)
    if (invalid) {
      setError(invalid)
      return
    }

    setError(undefined)
    setPending(file)
    setProgress(0)
    setStatus('uploading')
    try {
      setImage(await onUpload(file, setProgress))
      setStatus('done')
    } catch (caught) {
      setError(errorMessage(caught))
      setStatus('idle')
    } finally {
      setPending(null)
    }
  }

  const remove = async () => {
    if (!onRemove) return
    setError(undefined)
    try {
      await onRemove()
      setImage(null)
      setStatus('idle')
    } catch (caught) {
      setError(errorMessage(caught))
    }
  }

  const preview = previewUrl ? (
    <img src={previewUrl} alt="" className="size-full object-cover" />
  ) : (
    <SmartImage
      image={image}
      alt=""
      sizes={shape === 'cover' ? '(min-width: 768px) 640px, 100vw' : '128px'}
      width={shape === 'cover' ? 16 : 1}
      height={shape === 'cover' ? 9 : 1}
      fallback={fallback}
      className="size-full"
    />
  )

  return (
    <>
      <input
        ref={inputRef}
        id={`${id}-input`}
        type="file"
        accept={ACCEPT_ATTRIBUTE}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        onChange={(event) => {
          void choose(event.target.files?.[0])
          // Escolher o mesmo arquivo de novo também dispara.
          event.target.value = ''
        }}
      />
      <ImageUploaderView
        id={id}
        label={label}
        shape={shape}
        preview={preview}
        hasImage={Boolean(image) || Boolean(previewUrl)}
        status={status}
        progress={progress}
        error={error}
        canRemove={Boolean(onRemove)}
        disabled={disabled}
        onChoose={() => inputRef.current?.click()}
        onRemove={() => void remove()}
      />
    </>
  )
}
