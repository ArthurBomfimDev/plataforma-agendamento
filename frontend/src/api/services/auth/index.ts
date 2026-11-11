import type {
  AuthResponse,
  ContextTokenResponse,
  CurrentUserResponse,
  UserResponse,
} from '@api/models'
import { authRequest, request } from '@api/base'

import { authEndpoints } from './endpoints'

export const authService = {
  login: (email: string, password: string) =>
    request<AuthResponse>({
      method: 'POST',
      url: authEndpoints.login,
      data: { email, password },
    }),
  register: (email: string, password: string, fullName: string) =>
    request<UserResponse>({
      method: 'POST',
      url: authEndpoints.register,
      data: { email, password, fullName },
    }),
  logout: (refreshToken: string) =>
    request<void>({ method: 'POST', url: authEndpoints.logout, data: { refreshToken } }),
  confirmEmail: (token: string) =>
    request<void>({ method: 'POST', url: authEndpoints.confirmEmail, data: { token } }),
  /** Sempre 202, exista a conta ou não. */
  resendConfirmation: (email: string) =>
    request<void>({ method: 'POST', url: authEndpoints.resendConfirmation, data: { email } }),
  /** Sempre 202, exista a conta ou não. */
  forgotPassword: (email: string) =>
    request<void>({ method: 'POST', url: authEndpoints.forgotPassword, data: { email } }),
  resetPassword: (token: string, newPassword: string) =>
    request<void>({
      method: 'POST',
      url: authEndpoints.resetPassword,
      data: { token, newPassword },
    }),
  me: (signal?: AbortSignal) => authRequest<CurrentUserResponse>({ url: authEndpoints.me, signal }),
  /** "Minha conta" (7CF): só o nome. */
  updateMe: (fullName: string) =>
    authRequest<UserResponse>({ method: 'PUT', url: authEndpoints.me, data: { fullName } }),
  /** Pede a senha atual; devolve uma sessão nova e encerra as outras. */
  changePassword: (currentPassword: string, newPassword: string) =>
    authRequest<AuthResponse>({
      method: 'POST',
      url: authEndpoints.password,
      data: { currentPassword, newPassword },
    }),
  /** Painel de um estabelecimento (com `businessId`) ou consumidor (`null`). */
  switchContext: (businessId: string | null) =>
    authRequest<ContextTokenResponse>({
      method: 'POST',
      url: authEndpoints.context,
      data: { businessId },
    }),
}
