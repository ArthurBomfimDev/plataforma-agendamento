import type { PwaInstallEnv, UsePwaInstall } from './types'
import { createPwaInstallStore } from './store'
import { useSyncExternalStore } from 'react'

/** Fora do navegador (renderização dos testes, jsdom sem `matchMedia`), nada a instalar. */
const store =
  typeof window === 'undefined' || typeof window.matchMedia !== 'function'
    ? null
    : createPwaInstallStore(window as unknown as PwaInstallEnv)

const NEVER = () => () => undefined

/**
 * Instalação do app (regra 5 de empacotamento; ADR-035): nenhum componente toca `beforeinstallprompt`,
 * `display-mode` nem `navigator.standalone`. No Capacitor, troca-se o corpo deste hook, sem mexer em tela.
 */
export const usePwaInstall = (): UsePwaInstall => {
  const status = useSyncExternalStore(
    store?.subscribe ?? NEVER,
    store?.getSnapshot ?? (() => 'unavailable' as const),
    () => 'unavailable' as const,
  )

  return { status, install: store?.install ?? (async () => 'unavailable' as const) }
}
