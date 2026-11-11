import { registerSW } from 'virtual:pwa-register'

export type ServiceWorkerCallbacks = {
  /** Há uma versão nova do shell esperando a pessoa autorizar. */
  onNeedRefresh: () => void
  /** O shell já está guardado: o app abre sem rede (só o shell, nunca dado da API — ADR-035). */
  onOfflineReady: () => void
}

/** Ativa a versão nova e recarrega a página. */
export type ApplyServiceWorkerUpdate = (reload?: boolean) => Promise<void>

/**
 * Único ponto do app que fala com o registro do service worker (ADR-035). Quem usa são os hooks `usePwaUpdate`
 * e, nos testes, um dublê. Caminho relativo: o plugin gera o `sw.js` ao lado do `index.html` (regra 4 de empacotamento).
 */
export const registerServiceWorker = (
  callbacks: ServiceWorkerCallbacks,
): ApplyServiceWorkerUpdate => registerSW({ immediate: true, ...callbacks })
