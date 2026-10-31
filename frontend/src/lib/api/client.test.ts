import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from './errors'
import { api } from './client'
import { useSessionStore } from '@lib/zustand/session'

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

const session = {
  accessToken: 'velho',
  accessTokenExpiresAt: new Date().toISOString(),
  refreshToken: 'refresh-1',
}

afterEach(() => {
  vi.unstubAllGlobals()
  useSessionStore.getState().clearSession()
})

describe('api', () => {
  it('traduz o ProblemDetails no código estável do erro', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => json(401, { code: 'auth.invalid_credentials' })),
    )

    const error = (await api('/api/auth/login', { method: 'POST', body: {} }).catch(
      (e: unknown) => e,
    )) as ApiError

    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe('auth.invalid_credentials')
  })

  it('renova o token uma vez só, mesmo com várias chamadas recebendo 401 juntas', async () => {
    useSessionStore.getState().setSession(session)
    let refreshes = 0

    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init: RequestInit) => {
        if (url.endsWith('/api/auth/refresh')) {
          refreshes++
          return json(200, {
            accessToken: 'novo',
            accessTokenExpiresAt: new Date().toISOString(),
            refreshToken: 'refresh-2',
          })
        }
        const auth = (init.headers as Record<string, string>).Authorization
        return auth === 'Bearer novo' ? json(200, { ok: true }) : json(401, {})
      }),
    )

    // Duas renovações com o mesmo refresh token derrubariam a sessão inteira no backend.
    await Promise.all([api('/a', { auth: true }), api('/b', { auth: true })])

    expect(refreshes).toBe(1)
    expect(useSessionStore.getState().session?.refreshToken).toBe('refresh-2')
  })

  it('encerra a sessão local quando a renovação falha', async () => {
    useSessionStore.getState().setSession(session)
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => json(401, { code: 'auth.refresh_token_reused' })),
    )

    await expect(api('/a', { auth: true })).rejects.toBeInstanceOf(ApiError)
    expect(useSessionStore.getState().session).toBeNull()
  })

  it('sem rede, devolve status 0 para a tela dizer "sem conexão"', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch')
      }),
    )

    const error = (await api('/a').catch((e: unknown) => e)) as ApiError
    expect(error.status).toBe(0)
  })
})
