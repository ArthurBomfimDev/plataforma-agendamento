/** `GET /api/consents/versions`: a versão vigente e o texto dela. O que a pessoa lê é o que a versão registra. */
export type ConsentVersionsResponse = {
  sensitiveScheduling: string
  sensitiveSchedulingText: string
}

export type ConsentResponse = {
  id: string
  /** Hoje só `SensitiveScheduling`. */
  purpose: string
  version: string
  grantedAt: string
  /** Nulo: em vigor. */
  revokedAt: string | null
}
