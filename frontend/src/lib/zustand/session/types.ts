export type Session = {
  accessToken: string
  /** ISO 8601. */
  accessTokenExpiresAt: string
  refreshToken: string
}

export type SessionState = {
  session: Session | null
  setSession: (session: Session) => void
  clearSession: () => void
}
