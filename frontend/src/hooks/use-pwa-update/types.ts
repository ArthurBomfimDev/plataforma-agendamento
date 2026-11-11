import type { ApplyServiceWorkerUpdate, ServiceWorkerCallbacks } from '@utils/register-sw'

export type PwaUpdateState = {
  /** Há versão nova do app esperando autorização. */
  updateAvailable: boolean
  /** O shell foi guardado e o app já abre sem rede. */
  offlineReady: boolean
}

export type RegisterServiceWorker = (callbacks: ServiceWorkerCallbacks) => ApplyServiceWorkerUpdate

export type UsePwaUpdate = PwaUpdateState & {
  /** Ativa a versão nova e recarrega a página. Só quando a pessoa pede (ADR-035). */
  applyUpdate: () => void
  /** "Depois": esconde o aviso desta vez. */
  dismissUpdate: () => void
}
