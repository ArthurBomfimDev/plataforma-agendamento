import type { PendingRequest } from '../../types'

export type RequestCardProps = {
  request: PendingRequest
  now: Date
  onAccept: (request: PendingRequest) => void
  onReject: (request: PendingRequest) => void
}
