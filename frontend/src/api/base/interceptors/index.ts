import type { AuthResponse, ContextTokenResponse } from '@api/models'
import axios, { type AxiosInstance } from 'axios'
import { getSession, useSessionStore } from '@store/session'

import { ApiError } from '../errors'
import type { ProblemDetails } from '../types'

const bearer = (token: string) => `Bearer ${token}`

/** Erro do Axios → `ApiError`. Cancelamento passa intacto: quem cancelou não quer mensagem. */
const toApiError = (error: unknown) => {
  if (!axios.isAxiosError(error) || axios.isCancel(error)) return error
  // Rede fora ou API desligada: status 0, para a tela dizer "sem conexão".
  if (!error.response) return new ApiError(0, undefined, 'network')
  const data = error.response.data as ProblemDetails | string | undefined
  const problem = typeof data === 'object' ? data : undefined
  return new ApiError(error.response.status, problem?.code ?? problem?.title)
}

// Várias chamadas podem receber 401 ao mesmo tempo; todas esperam a MESMA renovação. Duas
// renovações em paralelo usariam o mesmo refresh token duas vezes — e o backend lê isso como
// roubo e derruba todas as sessões (rotação com detecção de reuso).
let refreshing: Promise<string | null> | null = null

const refreshAccessToken = (instance: AxiosInstance): Promise<string | null> => {
  const session = getSession()
  if (!session) return Promise.resolve(null)

  refreshing ??= (async () => {
    try {
      const { data: auth } = await instance.post<AuthResponse>('/api/auth/refresh', {
        refreshToken: session.refreshToken,
      })
      const store = useSessionStore.getState()
      store.setSession(auth)

      // O refresh devolve token de consumidor. No painel, pede o contexto de novo; se o vínculo
      // acabou nesse meio-tempo, a conta volta a ser só consumidor em vez de cair.
      const context = store.context
      if (!context) return auth.accessToken
      try {
        const { data: switched } = await instance.post<ContextTokenResponse>(
          '/api/users/me/context',
          { businessId: context.businessId },
          { headers: { Authorization: bearer(auth.accessToken) } },
        )
        store.setContext(switched.accessToken, switched.accessTokenExpiresAt, context)
        return switched.accessToken
      } catch {
        store.setContext(auth.accessToken, auth.accessTokenExpiresAt, null)
        return auth.accessToken
      }
    } catch {
      useSessionStore.getState().clearSession()
      return null
    } finally {
      refreshing = null
    }
  })()

  return refreshing
}

/**
 * Token no cabeçalho (regra 3 de empacotamento) nas chamadas `authenticated`; um 401 renova o token uma vez e
 * repete a chamada; todo erro sai como `ApiError`, com o código estável do ProblemDetails.
 */
export const registerInterceptors = (instance: AxiosInstance) => {
  instance.interceptors.request.use((config) => {
    const token = config.authenticated ? getSession()?.accessToken : undefined
    if (token) config.headers.Authorization = bearer(token)
    return config
  })

  instance.interceptors.response.use(undefined, async (error: unknown) => {
    const config = axios.isAxiosError(error) ? error.config : undefined
    const unauthorized = axios.isAxiosError(error) && error.response?.status === 401

    if (unauthorized && config?.authenticated && !config.retried && getSession()) {
      // A sessão renovada já está na store: a repetição pega o token novo no interceptor de requisição.
      if (await refreshAccessToken(instance)) return instance.request({ ...config, retried: true })
    }
    throw toApiError(error)
  })
}
