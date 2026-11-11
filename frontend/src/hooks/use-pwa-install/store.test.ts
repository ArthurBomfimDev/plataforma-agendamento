import { describe, expect, it, vi } from 'vitest'

import type { PwaInstallEnv } from './types'
import { createPwaInstallStore, isIos } from './store'

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1'
const ANDROID =
  'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36'

const setup = (
  options: { userAgent?: string; standalone?: boolean; iosStandalone?: boolean } = {},
) => {
  const handlers = new Map<string, (event: Event) => void>()
  const env: PwaInstallEnv = {
    addEventListener: (type, listener) => handlers.set(type, listener),
    removeEventListener: (type) => handlers.delete(type),
    matchMedia: () => ({ matches: options.standalone ?? false }),
    navigator: { userAgent: options.userAgent ?? ANDROID, standalone: options.iosStandalone },
  }
  const fire = (type: string, event: Event = new Event(type)) => handlers.get(type)?.(event)

  const promptEvent = (outcome: 'accepted' | 'dismissed') => {
    const event = new Event('beforeinstallprompt') as Event & {
      prompt: () => Promise<void>
      userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
    }
    event.prompt = vi.fn(async () => undefined)
    event.userChoice = Promise.resolve({ outcome })
    return event
  }

  return { store: createPwaInstallStore(env), fire, promptEvent }
}

describe('estado da instalação', () => {
  it('sem o evento do navegador, não há como instalar', () => {
    expect(setup().store.getSnapshot()).toBe('unavailable')
  })

  it('já rodando como app, está instalado (Android e iOS)', () => {
    expect(setup({ standalone: true }).store.getSnapshot()).toBe('installed')
    expect(setup({ userAgent: IPHONE, iosStandalone: true }).store.getSnapshot()).toBe('installed')
  })

  it('no iPhone, que não tem o evento, devolve a instrução manual', () => {
    expect(setup({ userAgent: IPHONE }).store.getSnapshot()).toBe('ios-manual')
  })

  it('guarda o evento e avisa quem assinou', () => {
    const { store, fire, promptEvent } = setup()
    const listener = vi.fn()
    store.subscribe(listener)

    fire('beforeinstallprompt', promptEvent('accepted'))

    expect(store.getSnapshot()).toBe('promptable')
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('cancela o evento padrão quando ele é cancelável', () => {
    const { fire } = setup()
    const event = new Event('beforeinstallprompt', { cancelable: true })
    fire('beforeinstallprompt', event)

    expect(event.defaultPrevented).toBe(true)
  })

  it('abre o diálogo, devolve a escolha e consome o evento', async () => {
    const { store, fire, promptEvent } = setup()
    const event = promptEvent('dismissed')
    fire('beforeinstallprompt', event)

    await expect(store.install()).resolves.toBe('dismissed')
    expect(event.prompt).toHaveBeenCalledTimes(1)
    expect(store.getSnapshot()).toBe('unavailable')
    await expect(store.install()).resolves.toBe('unavailable')
  })

  it('depois de instalado, o estado vira "installed"', () => {
    const { store, fire, promptEvent } = setup()
    fire('beforeinstallprompt', promptEvent('accepted'))
    fire('appinstalled')

    expect(store.getSnapshot()).toBe('installed')
  })

  it('instalar sem o evento não faz nada', async () => {
    await expect(setup().store.install()).resolves.toBe('unavailable')
  })
})

describe('isIos', () => {
  it('reconhece iPhone, iPad e o iPad que se diz Mac', () => {
    expect(isIos({ userAgent: IPHONE })).toBe(true)
    expect(isIos({ userAgent: 'Macintosh', platform: 'MacIntel', maxTouchPoints: 5 })).toBe(true)
  })

  it('não confunde Android nem Mac de verdade', () => {
    expect(isIos({ userAgent: ANDROID })).toBe(false)
    expect(isIos({ userAgent: 'Macintosh', platform: 'MacIntel', maxTouchPoints: 0 })).toBe(false)
  })
})
