/** Ids dos campos: o botão "Bloquear período" do cabeçalho e os erros levam o foco até eles. */
export const BLOCK_FIELD_IDS = {
  kind: 'block-kind',
  from: 'block-from',
  to: 'block-to',
  allDay: 'block-all-day',
  wholeBusiness: 'block-whole-business',
  startTime: 'block-start-time',
  endTime: 'block-end-time',
  reason: 'block-reason',
  cancellationReason: 'block-cancellation-reason',
} as const

/** Ordem em que o primeiro erro recebe o foco. */
export const FOCUS_ORDER = [
  'from',
  'to',
  'wholeBusiness',
  'startTime',
  'endTime',
  'cancellationReason',
] as const
