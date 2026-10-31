/** Ids dos campos: o botão "Bloquear período" do cabeçalho e os erros levam o foco até eles. */
export const BLOCK_FIELD_IDS = {
  kind: 'block-kind',
  target: 'block-target',
  from: 'block-from',
  to: 'block-to',
  allDay: 'block-all-day',
  startTime: 'block-start-time',
  endTime: 'block-end-time',
  reason: 'block-reason',
  cancellationReason: 'block-cancellation-reason',
} as const

/** Ordem em que o primeiro erro recebe o foco. */
export const FOCUS_ORDER = [
  'target',
  'from',
  'to',
  'startTime',
  'endTime',
  'cancellationReason',
] as const
