/**
 * - `installed`: já roda como app (tela inicial) ou acabou de ser instalado.
 * - `promptable`: o navegador deixa instalar com um toque (`beforeinstallprompt`).
 * - `ios-manual`: o iOS não tem o evento; só dá para instruir ("Compartilhar → Adicionar à Tela de Início").
 * - `unavailable`: sem como instalar agora (navegador sem suporte, ou o evento ainda não veio).
 */
export type PwaInstallStatus = 'installed' | 'promptable' | 'ios-manual' | 'unavailable'

export type PwaInstallOutcome = 'accepted' | 'dismissed' | 'unavailable'

/** O evento não faz parte do `lib.dom` do TypeScript. */
export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/** O que a loja precisa do navegador. Recebido por parâmetro para o teste usar um dublê. */
export type PwaInstallEnv = {
  addEventListener: (type: string, listener: (event: Event) => void) => void
  removeEventListener: (type: string, listener: (event: Event) => void) => void
  matchMedia: (query: string) => { matches: boolean }
  navigator: { userAgent: string; platform?: string; maxTouchPoints?: number; standalone?: boolean }
}

export type UsePwaInstall = {
  status: PwaInstallStatus
  /** Abre o diálogo de instalação do navegador. Só faz algo em `promptable`. */
  install: () => Promise<PwaInstallOutcome>
}
