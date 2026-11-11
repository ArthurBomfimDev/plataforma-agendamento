/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  /** Texto do aviso de ambiente de demonstração. Vazio ou ausente: sem aviso. Entra no build. */
  readonly VITE_DEMO_BANNER?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
