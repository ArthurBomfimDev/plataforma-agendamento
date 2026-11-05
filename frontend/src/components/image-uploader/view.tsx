import { HELP_TEXT, SHAPE_CLASSES } from './consts'

import { Button } from '@components/button'
import type { ImageUploaderViewProps } from './types'
import { cn } from 'cn'

/** Apresentação do `ImageUploader`, um estado por vez. Quem escolhe o arquivo e envia é o contêiner. */
export const ImageUploaderView = (props: ImageUploaderViewProps) => {
  const {
    id,
    label,
    description,
    helpExtra,
    note,
    shape,
    preview,
    hasImage,
    status,
    progress,
    fileName,
    problem,
    canRemove,
    disabled,
    onChoose,
    onRemove,
  } = props
  const uploading = status === 'uploading'
  const percent = Math.round(progress * 100)
  const card = shape === 'card'
  const help = card ? note : `${HELP_TEXT}${helpExtra ? ` · ${helpExtra}` : ''}`

  const frame = (
    <div
      className={cn(
        'relative overflow-hidden rounded-(--radius-sm) border border-(--border-subtle) bg-(--bg-surface-raised)',
        card && !hasImage && 'border-dashed',
        SHAPE_CLASSES[shape],
      )}
    >
      {preview}
      {uploading && <div aria-hidden="true" className="absolute inset-0 bg-(--bg-scrim)/30" />}
    </div>
  )

  const feedback = (
    <>
      {uploading && (
        <div className="flex flex-col gap-(--space-8)">
          <div
            role="progressbar"
            aria-labelledby={`${id}-label`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            aria-valuetext={`Enviando, ${percent}%`}
            className="h-2 w-full overflow-hidden rounded-(--radius-sm) bg-(--bg-surface-raised)"
          >
            <div
              className="h-full rounded-(--radius-sm) bg-(--action-primary) transition-[width] motion-reduce:transition-none"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="type-caption truncate text-(--text-muted)">
            {fileName ? `${fileName} · ${percent}%` : `Enviando… ${percent}%`}
          </p>
        </div>
      )}

      <p aria-live="polite" className="type-caption text-(--text-muted) empty:hidden">
        {status === 'done' ? 'Imagem salva.' : ''}
      </p>

      {problem && (
        <div id={`${id}-error`} role="alert" className="flex flex-col gap-(--space-8)">
          <p className="type-label text-(--status-rejected-fg)">{problem.title}</p>
          <div className="type-caption flex flex-col gap-(--space-4) rounded-(--radius-sm) border border-(--status-rejected-fg) bg-(--status-rejected-bg) px-(--space-12) py-2.5">
            <p className="text-(--status-rejected-fg)">{problem.message}</p>
            {problem.hint && <p className="text-(--text-muted)">{problem.hint}</p>}
          </div>
        </div>
      )}
    </>
  )

  const actions = (
    <div className="mt-auto flex gap-(--space-8)">
      <Button
        variant="secondary"
        className={card ? 'min-w-0 flex-1' : undefined}
        disabled={disabled || uploading}
        aria-describedby={problem ? `${id}-help ${id}-error` : `${id}-help`}
        onClick={onChoose}
      >
        {hasImage ? 'Trocar' : 'Escolher imagem'}
      </Button>
      {canRemove && hasImage && (
        <Button variant="ghost" disabled={disabled || uploading} onClick={onRemove}>
          Remover
        </Button>
      )}
    </div>
  )

  const helpLine = (
    <p id={`${id}-help`} className="type-caption text-(--text-muted) empty:hidden">
      {help}
    </p>
  )

  return (
    <div
      role="group"
      aria-labelledby={`${id}-label`}
      className="flex h-full min-w-0 flex-col gap-(--space-8)"
    >
      {card ? (
        <>
          {frame}
          {feedback}
          <div className="flex flex-col gap-px">
            <p id={`${id}-label`} className="type-label text-(--text-strong)">
              {label}
            </p>
            <p className="type-caption min-h-4 text-(--text-muted)">{description}</p>
          </div>
          {actions}
          {helpLine}
        </>
      ) : (
        <>
          <p id={`${id}-label`} className="type-label text-(--text-strong)">
            {label}
          </p>
          {frame}
          {feedback}
          {helpLine}
          {actions}
        </>
      )}
    </div>
  )
}
