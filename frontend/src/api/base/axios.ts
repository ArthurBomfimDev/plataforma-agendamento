import axios, { type AxiosRequestConfig } from 'axios'

import { registerInterceptors } from './interceptors'

/**
 * URL base da API. Vem de variável de ambiente (regra 1 de empacotamento, CLAUDE.md §3) e nunca de
 * `window.location.origin` (regra 2): dentro do Capacitor e do Tauri a origem não é a da API.
 *
 * É embutida no build pelo Vite. Em desenvolvimento, defina em `frontend/.env.local`;
 * no Docker, chega como build arg (ver `compose.yaml`).
 */
export const apiBaseUrl: string = import.meta.env.VITE_API_BASE_URL ?? ''

/**
 * Única porta para a API (regra 1 de empacotamento). Adaptador `fetch`: é o que os WebViews do Capacitor e do
 * Tauri têm em comum com o navegador. O envio de arquivo troca para `xhr` na própria chamada, pelo progresso.
 */
export const http = axios.create({
  baseURL: apiBaseUrl,
  adapter: 'fetch',
  headers: { Accept: 'application/json' },
})

registerInterceptors(http)

/** Uma chamada que devolve só o corpo da resposta. Os serviços de `api/services` falam por aqui. */
export const request = <T>(config: AxiosRequestConfig) =>
  http.request<T>(config).then(({ data }) => data)

/** Chamada com o access token: tudo que é da conta ou do painel. */
export const authRequest = <T>(config: AxiosRequestConfig) =>
  request<T>({ ...config, authenticated: true })
