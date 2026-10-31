export type AuthResponse = {
  accessToken: string
  accessTokenExpiresAt: string
  refreshToken: string
}

export type UserResponse = {
  id: string
  email: string
  fullName: string
  emailConfirmed: boolean
}

export type BusinessRole = 'Owner' | 'Professional'

/** Estabelecimento em que a conta tem vínculo ativo: um item do seletor de contexto. */
export type UserBusinessResponse = { businessId: string; name: string; role: BusinessRole }

/** `GET /api/users/me` (Onda 7A): a conta e os contextos que ela pode abrir. */
export type CurrentUserResponse = UserResponse & {
  hasCustomerProfile: boolean
  businesses: UserBusinessResponse[]
}

/** `POST /api/users/me/context`. Sem `businessId`, o token volta a ser de consumidor. */
export type ContextTokenResponse = {
  accessToken: string
  accessTokenExpiresAt: string
  businessId: string | null
  role: BusinessRole | null
}
