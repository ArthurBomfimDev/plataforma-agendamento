import { getSession, useSessionStore } from '@lib/zustand/session'

import { ApiError } from './errors'
import type { AuthResponse } from './types'
import { apiBaseUrl } from './config'

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  /** Manda o access token. Rotas públicas da vitrine não precisam. */
  auth?: boolean
  signal?: AbortSignal
}

const url = (path: string) => `${apiBaseUrl}${path}`

async function send(path: string, options: RequestOptions, accessToken?: string) {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  try {
    return await fetch(url(path), {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    // Rede fora ou API desligada: status 0, para a tela dizer "sem conexão".
    throw new ApiError(0, undefined, 'network')
  }
}

async function parse<T>(response: Response): Promise<T> {
  const text = await response.text()
  const isJson = response.headers.get('content-type')?.includes('json') ?? false
  const data = text && isJson ? JSON.parse(text) : undefined

  if (!response.ok) {
    throw new ApiError(response.status, data?.code ?? data?.title)
  }
  return data as T
}

// Várias chamadas podem receber 401 ao mesmo tempo; todas esperam a MESMA renovação. Duas
// renovações em paralelo usariam o mesmo refresh token duas vezes — e o backend lê isso como
// roubo e derruba todas as sessões (rotação com detecção de reuso).
let refreshing: Promise<string | null> | null = null

function refreshAccessToken(): Promise<string | null> {
  const session = getSession()
  if (!session) return Promise.resolve(null)

  refreshing ??= (async () => {
    try {
      const response = await send('/api/auth/refresh', {
        method: 'POST',
        body: { refreshToken: session.refreshToken },
      })
      const auth = await parse<AuthResponse>(response)
      useSessionStore.getState().setSession(auth)
      return auth.accessToken
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
 * Única porta para a API (regra 1 de empacotamento). A `baseURL` vem de `VITE_API_BASE_URL`.
 * Com `auth`, renova o access token uma vez se ele expirou e repete a chamada.
 */
export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = options.auth ? getSession()?.accessToken : undefined
  let response = await send(path, options, token)

  if (response.status === 401 && options.auth && getSession()) {
    const renewed = await refreshAccessToken()
    if (renewed) response = await send(path, options, renewed)
  }

  return parse<T>(response)
}
