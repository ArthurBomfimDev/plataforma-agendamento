import { ACCEPT_ATTRIBUTE, SHAPE_IMAGE, validateImageFile } from './consts'
import type { ImageUploaderProps, UploadProblem, UploadStatus } from './types'
import { useRef, useState } from 'react'

import { ConfirmDialog } from '@components/confirm-dialog'
import { ImageUploaderView } from './view'
import { SmartImage } from '@components/smart-image'
import { errorMessage } from '@api/base'
import { useObjectUrl } from '@hooks/use-object-url'

/**
 * Envio de imagem (Onda 6D; estados no Figma 19b): escolher arquivo, pré-visualizar, enviar com barra de progresso,
 * remover (com confirmação). Por teclado e por leitor de tela: o botão abre o seletor do sistema; o `<input
 * type="file">` fica escondido e fora da ordem de tabulação; progresso, resultado e erro são anunciados.
 *
 * Usado no logotipo, na capa e na foto de cada profissional. Como plugar: `docs/produto/contrato-api-frontend.md`
 * §4.5.
 */
export const ImageUploader = (props: ImageUploaderProps) => {
  const {
    id,
    label,
    description,
    helpExtra,
    note,
    current,
    fallback,
    shape = 'cover',
    onUpload,
    onRemove,
    removeOf = 'desta imagem',
    disabled,
  } = props
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
  const [problem, setProblem] = useState<UploadProblem>()
  const [confirmingRemove, setConfirmingRemove] = useState(false)
  const [removing, setRemoving] = useState(false)
  const previewUrl = useObjectUrl(pending)

  const choose = async (file: File | undefined) => {
    // Um envio por vez: escolher de novo durante o envio não dispara outro.
    if (!file || status === 'uploading') return
    const invalid = validateImageFile(file)
    if (invalid) {
      setProblem(invalid)
      return
    }

    setProblem(undefined)
    setPending(file)
    setProgress(0)
    setStatus('uploading')
    try {
      setImage(await onUpload(file, setProgress))
      setStatus('done')
    } catch (caught) {
      setProblem({ title: 'Não foi possível enviar', message: errorMessage(caught) })
      setStatus('idle')
    } finally {
      setPending(null)
    }
  }

  const remove = async () => {
    if (!onRemove || removing) return
    setProblem(undefined)
    setRemoving(true)
    try {
      await onRemove()
      setImage(null)
      setStatus('idle')
    } catch (caught) {
      setProblem({ title: 'Não foi possível remover', message: errorMessage(caught) })
    } finally {
      setRemoving(false)
    }
  }

  const { width, height, sizes } = SHAPE_IMAGE[shape]
  const preview = previewUrl ? (
    <img src={previewUrl} alt="" className="size-full object-cover" />
  ) : (
    <SmartImage
      image={image}
      alt=""
      sizes={sizes}
      width={width}
      height={height}
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
        description={description}
        helpExtra={helpExtra}
        note={note}
        shape={shape}
        preview={preview}
        hasImage={Boolean(image) || Boolean(previewUrl)}
        status={status}
        progress={progress}
        fileName={pending?.name}
        problem={problem}
        canRemove={Boolean(onRemove)}
        disabled={disabled || removing}
        onChoose={() => inputRef.current?.click()}
        onRemove={() => setConfirmingRemove(true)}
      />
      <ConfirmDialog
        open={confirmingRemove}
        onOpenChange={setConfirmingRemove}
        title={`Remover a imagem ${removeOf}?`}
        description="A imagem sai da página pública e volta a aparecer a imagem padrão. Você pode enviar outra depois."
        confirmLabel="Remover imagem"
        dismissLabel="Manter imagem"
        onConfirm={() => {
          setConfirmingRemove(false)
          void remove()
        }}
      />
    </>
  )
}
