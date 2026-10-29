import { PX_PER_MINUTE, SNAP_MINUTES } from '@features/business-agenda/consts'

import type { Modifier } from '@dnd-kit/core'

/** Abaixo disso o bloco só tem altura para uma linha: o consumidor fica de fora. */
export const TWO_LINES_MIN_MINUTES = 45

/** Altura mínima de um bloco, para a linha de texto caber (20 min no Figma). */
export const MIN_BLOCK_HEIGHT = 28

/** Duração da prévia de encaixe ao passar o mouse sobre um horário vazio. */
export const FIT_IN_PREVIEW_MINUTES = 30

export const SNAP_PX = SNAP_MINUTES * PX_PER_MINUTE

/** Na vertical, o bloco anda de 15 em 15 min; na horizontal, livre, para trocar de coluna. */
export const snapToQuarterHour: Modifier = ({ transform }) => ({
  ...transform,
  y: Math.round(transform.y / SNAP_PX) * SNAP_PX,
})

export const ENTRY_CLASSES = {
  confirmed: 'bg-(--bg-inverse) text-(--text-on-inverse)',
  // Já atendido ou faltou: sai do destaque, mas continua ocupando o horário.
  completed: 'bg-(--status-completed-bg) text-(--status-completed-fg)',
  'no-show': 'border border-(--status-noshow-fg) bg-(--status-noshow-bg) text-(--status-noshow-fg)',
  pending:
    'border border-dashed border-(--status-pending-fg) bg-(--bg-surface) text-(--status-pending-fg)',
  block: 'bg-(--bg-surface-raised) text-(--text-muted)',
  offHours: 'bg-(--bg-surface-raised) text-(--text-disabled)',
}

export const BLOCK_BASE =
  'type-caption tabular flex size-full flex-col gap-(--space-2) overflow-hidden rounded-sm px-(--space-8) text-left'

export const blockGeometry = (start: number, durationMinutes: number, axisStart: number) => ({
  top: (start - axisStart) * PX_PER_MINUTE + 2,
  height: Math.max(durationMinutes * PX_PER_MINUTE - 4, MIN_BLOCK_HEIGHT),
})

export const blockPadding = (durationMinutes: number) =>
  durationMinutes >= 30 ? 'py-(--space-8)' : 'py-(--space-4)'
