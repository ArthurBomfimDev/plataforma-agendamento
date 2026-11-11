import type {
  BeforeInstallPromptEvent,
  PwaInstallEnv,
  PwaInstallOutcome,
  PwaInstallStatus,
} from './types'

export const STANDALONE_QUERY = '(display-mode: standalone)'

/** iPhone, iPad e iPod; o iPad recente se diz Mac, mas tem toque. */
export const isIos = ({ userAgent, platform, maxTouchPoints }: PwaInstallEnv['navigator']) =>
  /iPad|iPhone|iPod/.test(userAgent) || (platform === 'MacIntel' && (maxTouchPoints ?? 0) > 1)

/**
 * Estado da instalação do app (ADR-035). O `beforeinstallprompt` dispara uma vez, cedo, às vezes antes de qualquer
 * componente montar: a loja existe desde o carregamento do módulo e guarda o evento até a pessoa pedir.
 */
export const createPwaInstallStore = (env: PwaInstallEnv) => {
  let deferred: BeforeInstallPromptEvent | null = null
  let installed = false
  let status: PwaInstallStatus = 'unavailable'
  const listeners = new Set<() => void>()

  const compute = (): PwaInstallStatus => {
    const standalone = env.matchMedia(STANDALONE_QUERY).matches || env.navigator.standalone === true
    if (installed || standalone) return 'installed'
    if (deferred) return 'promptable'
    return isIos(env.navigator) ? 'ios-manual' : 'unavailable'
  }

  const refresh = () => {
    const next = compute()
    if (next === status) return
    status = next
    listeners.forEach((listener) => listener())
  }

  env.addEventListener('beforeinstallprompt', (event) => {
    // Sem isso o navegador mostraria o próprio banner; a decisão de quando perguntar é do app.
    event.preventDefault()
    deferred = event as BeforeInstallPromptEvent
    refresh()
  })
  env.addEventListener('appinstalled', () => {
    installed = true
    deferred = null
    refresh()
  })
  status = compute()

  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    getSnapshot: () => status,
    install: async (): Promise<PwaInstallOutcome> => {
      const event = deferred
      if (!event) return 'unavailable'
      // O evento só vale uma vez: depois do diálogo, o navegador manda outro se ainda der para instalar.
      deferred = null
      refresh()
      await event.prompt()
      const { outcome } = await event.userChoice
      return outcome
    },
  }
}
