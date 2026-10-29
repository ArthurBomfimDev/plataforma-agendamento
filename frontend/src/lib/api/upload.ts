import { getSession, useSessionStore } from '@lib/zustand/session'

import { ApiError } from './errors'
import { apiBaseUrl } from './config'
import { refreshAccessToken } from './client'

type UploadOptions = {
  method?: 'PUT' | 'POST'
  /** Fração enviada, de 0 a 1. */
  onProgress?: (fraction: number) => void
  signal?: AbortSignal
}

/**
 * Envio de arquivo (`multipart/form-data`, campo `file`) com progresso. É `XMLHttpRequest` porque o `fetch` não
 * informa o progresso do upload. Mesma porta da API (regra 1): `baseURL` de ambiente, token no cabeçalho (regra 3)
 * e uma renovação do token se ele expirou.
 */
export async function uploadFile<T>(
  path: string,
  file: File,
  options: UploadOptions = {},
): Promise<T> {
  const attempt = (token: string | undefined) => send<T>(path, file, options, token)

  try {
    return await attempt(getSession()?.accessToken)
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401 || !getSession()) throw error
    const renewed = await refreshAccessToken()
    if (!renewed) {
      useSessionStore.getState().clearSession()
      throw error
    }
    return attempt(renewed)
  }
}

function send<T>(path: string, file: File, options: UploadOptions, token?: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open(options.method ?? 'PUT', `${apiBaseUrl}${path}`)
    xhr.setRequestHeader('Accept', 'application/json')
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) options.onProgress?.(event.loaded / event.total)
    }

    xhr.onload = () => {
      const isJson = xhr.getResponseHeader('content-type')?.includes('json') ?? false
      let data: { code?: string; title?: string } | undefined
      try {
        data = xhr.responseText && isJson ? JSON.parse(xhr.responseText) : undefined
      } catch {
        data = undefined
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        options.onProgress?.(1)
        resolve(data as T)
      } else {
        reject(new ApiError(xhr.status, data?.code ?? data?.title))
      }
    }

    // Rede fora ou API desligada: status 0, como no cliente `fetch`.
    xhr.onerror = () => reject(new ApiError(0, undefined, 'network'))
    xhr.onabort = () => reject(new DOMException('Envio cancelado.', 'AbortError'))
    options.signal?.addEventListener('abort', () => xhr.abort(), { once: true })

    const form = new FormData()
    form.append('file', file)
    xhr.send(form)
  })
}
