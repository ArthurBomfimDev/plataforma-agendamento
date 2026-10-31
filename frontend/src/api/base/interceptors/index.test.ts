import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { ApiError } from '../errors'
import { http, request } from '../axios'
import { useSessionStore } from '@store/session'

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

/** O Axios chama o `fetch` com um `Request` já montado. */
const stubFetch = (handler: (request: Request) => Response | Promise<Response>) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: Request) => handler(input)),
  )

const session = {
  accessToken: 'velho',
  accessTokenExpiresAt: new Date().toISOString(),
  refreshToken: 'refresh-1',
}

// No Node, o `Request` do `fetch` só aceita URL absoluta.
beforeAll(() => {
  http.defaults.baseURL = 'http://api.test'
})

afterEach(() => {
  vi.unstubAllGlobals()
  useSessionStore.getState().clearSession()
})

describe('interceptors', () => {
  it('traduz o ProblemDetails no código estável do erro', async () => {
    stubFetch(() => json(401, { code: 'auth.invalid_credentials' }))

    const error = (await request({ method: 'POST', url: '/api/auth/login', data: {} }).catch(
      (e: unknown) => e,
    )) as ApiError

    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe('auth.invalid_credentials')
  })

  it('renova o token uma vez só, mesmo com várias chamadas recebendo 401 juntas', async () => {
    useSessionStore.getState().setSession(session)
    let refreshes = 0

    stubFetch((input) => {
      if (input.url.endsWith('/api/auth/refresh')) {
        refreshes++
        return json(200, {
          accessToken: 'novo',
          accessTokenExpiresAt: new Date().toISOString(),
          refreshToken: 'refresh-2',
        })
      }
      return input.headers.get('Authorization') === 'Bearer novo'
        ? json(200, { ok: true })
        : json(401, {})
    })

    // Duas renovações com o mesmo refresh token derrubariam a sessão inteira no backend.
    await Promise.all([
      request({ url: '/a', authenticated: true }),
      request({ url: '/b', authenticated: true }),
    ])

    expect(refreshes).toBe(1)
    expect(useSessionStore.getState().session?.refreshToken).toBe('refresh-2')
  })

  it('encerra a sessão local quando a renovação falha', async () => {
    useSessionStore.getState().setSession(session)
    stubFetch(() => json(401, { code: 'auth.refresh_token_reused' }))

    await expect(request({ url: '/a', authenticated: true })).rejects.toBeInstanceOf(ApiError)
    expect(useSessionStore.getState().session).toBeNull()
  })

  it('não manda token em rota pública', async () => {
    useSessionStore.getState().setSession(session)
    let authorization: string | null = 'não lido'
    stubFetch((input) => {
      authorization = input.headers.get('Authorization')
      return json(200, {})
    })

    await request({ url: '/api/businesses/x' })
    expect(authorization).toBeNull()
  })

  it('sem rede, devolve status 0 para a tela dizer "sem conexão"', async () => {
    stubFetch(() => {
      throw new TypeError('Failed to fetch')
    })

    const error = (await request({ url: '/a' }).catch((e: unknown) => e)) as ApiError
    expect(error.status).toBe(0)
  })
})
