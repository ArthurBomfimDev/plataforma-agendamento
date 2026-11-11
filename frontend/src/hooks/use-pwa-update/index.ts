import type { UsePwaUpdate } from './types'
import { createPwaUpdateStore } from './store'
import { registerServiceWorker } from '@utils/register-sw'
import { useEffect, useSyncExternalStore } from 'react'

const store = createPwaUpdateStore(registerServiceWorker)

/**
 * Atualização do app instalado (regra 5 de empacotamento; ADR-035): nenhum componente fala com o service worker.
 * A versão nova só entra quando a pessoa chama `applyUpdate`: nada de trocar o shell no meio de um agendamento.
 */
export const usePwaUpdate = (): UsePwaUpdate => {
  useEffect(() => store.start(), [])
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)

  return { ...state, applyUpdate: store.applyUpdate, dismissUpdate: store.dismissUpdate }
}
