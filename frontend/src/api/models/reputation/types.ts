/** Nota de um estabelecimento ou profissional. `average` é nulo enquanto há menos de 3 avaliações: o alvo é "Novo". */
export type RatingSummaryResponse = {
  average: number | null
  count: number
  /** Quantas notas de 1 a 5, nessa ordem. */
  distribution: number[]
  isNew: boolean
}

/** Avaliação como o público a vê: só "Ana S.", nunca id de consumidor. Em Saúde `serviceName` é nulo. */
export type PublicReviewResponse = {
  id: string
  rating: number
  professionalRating: number | null
  comment: string | null
  reviewerName: string
  serviceName: string | null
  reviewedAt: string
}

/** A avaliação do próprio consumidor. `canEdit`: ainda não foi editada e está nos 7 dias. */
export type MyReviewResponse = {
  id: string
  appointmentId: string
  businessId: string
  professionalId: string
  rating: number
  professionalRating: number | null
  comment: string | null
  serviceName: string | null
  reviewedAt: string
  editedAt: string | null
  canEdit: boolean
}

/** A avaliação como o dono a vê no painel. `reported`: ele já denunciou (uma vez só). */
export type OwnerReviewResponse = {
  id: string
  rating: number
  professionalRating: number | null
  comment: string | null
  reviewerName: string
  serviceName: string | null
  reviewedAt: string
  reported: boolean
}

/** Item da fila do Admin. `reportOpen`: a denúncia ainda espera decisão. */
export type ModerationReviewResponse = {
  id: string
  businessId: string
  businessName: string
  rating: number
  professionalRating: number | null
  comment: string | null
  reviewerName: string
  reviewedAt: string
  reportReason: string | null
  reportedAt: string | null
  reportOpen: boolean
  isHidden: boolean
  hiddenReason: string | null
  hiddenAt: string | null
  hiddenByUserId: string | null
}

export type SaveReviewRequest = {
  rating: number
  professionalRating: number | null
  comment: string | null
}
