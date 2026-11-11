import type { PwaUpdateState, RegisterServiceWorker } from './types'
import type { ApplyServiceWorkerUpdate } from '@utils/register-sw'

/**
 * Estado compartilhado do service worker. O registro acontece uma vez só, não por componente: por isso é um
 * armazenamento fora do React, e o hook assina por `useSyncExternalStore`. Recebe o registro por parâmetro para o
 * teste não precisar de service worker.
 */
export const createPwaUpdateStore = (register: RegisterServiceWorker) => {
  let state: PwaUpdateState = { updateAvailable: false, offlineReady: false }
  let apply: ApplyServiceWorkerUpdate | null = null
  let started = false
  const listeners = new Set<() => void>()

  const set = (next: Partial<PwaUpdateState>) => {
    state = { ...state, ...next }
    listeners.forEach((listener) => listener())
  }

  return {
    /** Registra o service worker, uma única vez. */
    start: () => {
      if (started) return
      started = true
      apply = register({
        onNeedRefresh: () => set({ updateAvailable: true }),
        onOfflineReady: () => set({ offlineReady: true }),
      })
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    getSnapshot: () => state,
    applyUpdate: () => {
      void apply?.(true)
    },
    dismissUpdate: () => set({ updateAvailable: false }),
  }
}
