import 'axios'

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Manda o access token. Rotas públicas da vitrine não precisam. */
    authenticated?: boolean
    /** Já repetida depois de renovar o token: um segundo 401 não renova de novo. */
    retried?: boolean
  }
}

/** Corpo de erro do backend (ProblemDetails). `code` é o código estável; `title`, o reserva. */
export type ProblemDetails = { code?: string; title?: string }
