import type { PendingRequest } from '../../types'

export type RequestCardProps = {
  request: PendingRequest
  now: Date
  /** Resposta deste pedido em andamento: os botões não enviam de novo. */
  busy?: boolean
  onAccept: (request: PendingRequest) => void
  onReject: (request: PendingRequest) => void
}
