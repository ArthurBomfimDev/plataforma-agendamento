import { describe, expect, it, vi } from 'vitest'

import type { ServiceWorkerCallbacks } from '@utils/register-sw'
import { createPwaUpdateStore } from './store'

const setup = () => {
  let callbacks: ServiceWorkerCallbacks | undefined
  const reload = vi.fn(async () => undefined)
  const register = vi.fn((given: ServiceWorkerCallbacks) => {
    callbacks = given
    return reload
  })
  return { store: createPwaUpdateStore(register), register, reload, callbacks: () => callbacks! }
}

describe('estado do service worker', () => {
  it('começa sem nada a avisar', () => {
    expect(setup().store.getSnapshot()).toEqual({ updateAvailable: false, offlineReady: false })
  })

  it('registra o service worker uma única vez, mesmo com vários componentes', () => {
    const { store, register } = setup()
    store.start()
    store.start()

    expect(register).toHaveBeenCalledTimes(1)
  })

  it('avisa quando há versão nova e quando o app já abre sem rede', () => {
    const { store, callbacks } = setup()
    const listener = vi.fn()
    store.subscribe(listener)
    store.start()

    callbacks().onNeedRefresh()
    expect(store.getSnapshot().updateAvailable).toBe(true)

    callbacks().onOfflineReady()
    expect(store.getSnapshot().offlineReady).toBe(true)
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('só atualiza quando a pessoa pede, e recarrega a página', () => {
    const { store, reload, callbacks } = setup()
    store.start()
    callbacks().onNeedRefresh()
    expect(reload).not.toHaveBeenCalled()

    store.applyUpdate()
    expect(reload).toHaveBeenCalledWith(true)
  })

  it('"Depois" esconde o aviso sem atualizar', () => {
    const { store, reload, callbacks } = setup()
    store.start()
    callbacks().onNeedRefresh()

    store.dismissUpdate()
    expect(store.getSnapshot().updateAvailable).toBe(false)
    expect(reload).not.toHaveBeenCalled()
  })

  it('atualizar antes de registrar não quebra', () => {
    expect(() => setup().store.applyUpdate()).not.toThrow()
  })

  it('quem deixou de assinar não é mais avisado', () => {
    const { store, callbacks } = setup()
    const listener = vi.fn()
    const unsubscribe = store.subscribe(listener)
    store.start()
    unsubscribe()

    callbacks().onNeedRefresh()
    expect(listener).not.toHaveBeenCalled()
  })
})
