import { AddPhotoIcon, DeleteIcon } from '@assets/icons'

import { Button } from '@components/button'
import type { ImageUploaderViewProps } from './types'
import { SHAPE_CLASSES } from './consts'
import { cn } from 'cn'

/** Apresentação do `ImageUploader`, um estado por vez. Quem escolhe o arquivo e envia é o contêiner. */
export const ImageUploaderView = (props: ImageUploaderViewProps) => {
  const {
    id,
    label,
    shape,
    preview,
    hasImage,
    status,
    progress,
    error,
    canRemove,
    disabled,
    onChoose,
    onRemove,
  } = props
  const uploading = status === 'uploading'
  const percent = Math.round(progress * 100)

  return (
    <div role="group" aria-labelledby={`${id}-label`} className="flex flex-col gap-(--space-12)">
      <p id={`${id}-label`} className="type-label text-(--text-body)">
        {label}
      </p>

      <div
        className={cn(
          'relative overflow-hidden border border-(--border-subtle) bg-(--bg-surface-raised)',
          SHAPE_CLASSES[shape],
        )}
      >
        {preview}
        {uploading && <div aria-hidden="true" className="absolute inset-0 bg-(--bg-scrim)/30" />}
      </div>

      {uploading && (
        <div className="flex flex-col gap-(--space-4)">
          <div
            role="progressbar"
            aria-labelledby={`${id}-label`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            aria-valuetext={`Enviando, ${percent}%`}
            className="h-2 w-full overflow-hidden rounded-(--radius-full) bg-(--bg-disabled)"
          >
            <div
              className="h-full bg-(--action-primary) transition-[width] motion-reduce:transition-none"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      )}

      <p aria-live="polite" className="type-caption text-(--text-muted) empty:hidden">
        {uploading ? `Enviando… ${percent}%` : status === 'done' ? 'Imagem salva.' : ''}
      </p>

      {error && (
        <p id={`${id}-error`} role="alert" className="type-label text-(--status-rejected-fg)">
          {error}
        </p>
      )}

      <p id={`${id}-help`} className="type-caption text-(--text-muted)">
        JPEG, PNG ou WebP, até 5 MB.
      </p>

      <div className="flex flex-wrap gap-(--space-8)">
        <Button
          variant="secondary"
          disabled={disabled || uploading}
          aria-describedby={error ? `${id}-help ${id}-error` : `${id}-help`}
          onClick={onChoose}
        >
          <AddPhotoIcon aria-hidden="true" className="size-4" />
          {hasImage ? 'Trocar imagem' : 'Escolher imagem'}
        </Button>
        {canRemove && hasImage && (
          <Button variant="ghost" disabled={disabled || uploading} onClick={onRemove}>
            <DeleteIcon aria-hidden="true" className="size-4" />
            Remover
          </Button>
        )}
      </div>
    </div>
  )
}
