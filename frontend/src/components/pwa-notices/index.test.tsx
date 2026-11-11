// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { click, mount, unmountAll } from '@utils/test-dom'

import { INSTALL_DISMISSED_KEY, PwaNotices } from '.'
import { PwaNoticesView } from './view'
import type { PwaNoticesViewProps } from './types'

const state = vi.hoisted(() => ({
  online: true,
  update: {
    updateAvailable: false,
    offlineReady: false,
    applyUpdate: vi.fn(),
    dismissUpdate: vi.fn(),
  },
  install: { status: 'unavailable' as string, install: vi.fn() },
}))

vi.mock('@hooks/use-online-status', () => ({ useOnlineStatus: () => state.online }))
vi.mock('@hooks/use-pwa-update', () => ({ usePwaUpdate: () => state.update }))
vi.mock('@hooks/use-pwa-install', () => ({ usePwaInstall: () => state.install }))

const handlers = () => ({
  onUpdate: vi.fn(),
  onDismissUpdate: vi.fn(),
  onInstall: vi.fn(),
  onDismissInstall: vi.fn(),
})

const view = (props: Partial<PwaNoticesViewProps> = {}) => {
  const callbacks = handlers()
  const { container } = mount(
    <PwaNoticesView
      offline={false}
      updateAvailable={false}
      installPrompt={null}
      {...callbacks}
      {...props}
    />,
  )
  return { container, callbacks }
}

const button = (container: HTMLElement, label: string) =>
  [...container.querySelectorAll('button')].find(
    (candidate) => candidate.textContent === label,
  ) as HTMLButtonElement

afterEach(() => {
  unmountAll()
  localStorage.clear()
})

beforeEach(() => {
  state.online = true
  state.update = {
    updateAvailable: false,
    offlineReady: false,
    applyUpdate: vi.fn(),
    dismissUpdate: vi.fn(),
  }
  state.install = { status: 'unavailable', install: vi.fn() }
})

describe('PwaNoticesView', () => {
  it('vazio: sem nada a avisar, não desenha nada', () => {
    expect(view().container.innerHTML).toBe('')
  })

  it('sem conexão: avisa em português e não pede ação', () => {
    const { container } = view({ offline: true })

    expect(container.textContent).toContain('Você está sem conexão')
    expect(container.querySelector('[role="status"]')).not.toBeNull()
    expect(container.querySelectorAll('button')).toHaveLength(0)
  })

  it('nova versão: "Atualizar agora" e "Depois" chamam cada um o seu', () => {
    const { container, callbacks } = view({ updateAvailable: true })

    expect(container.textContent).toContain('Nova versão disponível')
    click(button(container, 'Atualizar agora'))
    click(button(container, 'Depois'))

    expect(callbacks.onUpdate).toHaveBeenCalledTimes(1)
    expect(callbacks.onDismissUpdate).toHaveBeenCalledTimes(1)
  })

  it('instalar: o navegador deixa, então há botão', () => {
    const { container, callbacks } = view({ installPrompt: 'promptable' })

    click(button(container, 'Instalar'))
    click(button(container, 'Agora não'))

    expect(callbacks.onInstall).toHaveBeenCalledTimes(1)
    expect(callbacks.onDismissInstall).toHaveBeenCalledTimes(1)
  })

  it('instalar no iPhone: só a instrução, sem botão de instalar', () => {
    const { container } = view({ installPrompt: 'ios-manual' })

    expect(container.textContent).toContain('Adicionar à Tela de Início')
    expect(button(container, 'Instalar')).toBeUndefined()
    expect(button(container, 'Entendi')).toBeDefined()
  })

  it('todo botão tem altura mínima de 44 px (regra 6)', () => {
    const { container } = view({ updateAvailable: true, installPrompt: 'promptable' })

    const buttons = [...container.querySelectorAll('button')]
    expect(buttons.length).toBeGreaterThan(0)
    for (const item of buttons) expect(item.className).toContain('min-h-11')
  })

  it('respeita a área segura do topo (regra 6)', () => {
    const { container } = view({ offline: true })

    expect(container.innerHTML).toContain('env(safe-area-inset-top)')
  })
})

describe('PwaNotices (com os hooks)', () => {
  it('online e sem novidade: nada na tela', () => {
    expect(mount(<PwaNotices />).container.innerHTML).toBe('')
  })

  it('offline: mostra o aviso e some ao voltar a rede', () => {
    state.online = false
    const first = mount(<PwaNotices />)
    expect(first.container.textContent).toContain('sem conexão')

    state.online = true
    first.rerender(<PwaNotices />)
    expect(first.container.innerHTML).toBe('')
  })

  it('versão nova: atualizar chama o hook, e só ele', () => {
    state.update.updateAvailable = true
    const { container } = mount(<PwaNotices />)

    click(button(container, 'Atualizar agora'))
    expect(state.update.applyUpdate).toHaveBeenCalledTimes(1)
  })

  it('instalar: recusar no diálogo do navegador lembra a escolha neste aparelho', async () => {
    state.install = { status: 'promptable', install: vi.fn().mockResolvedValue('dismissed') }
    const { container, rerender } = mount(<PwaNotices />)

    click(button(container, 'Instalar'))
    await vi.waitFor(() => expect(localStorage.getItem(INSTALL_DISMISSED_KEY)).toBe('1'))
    rerender(<PwaNotices />)

    expect(container.innerHTML).toBe('')
  })

  it('instalar: "Agora não" não pergunta de novo na próxima visita', () => {
    state.install = { status: 'promptable', install: vi.fn() }
    click(button(mount(<PwaNotices />).container, 'Agora não'))
    unmountAll()

    expect(mount(<PwaNotices />).container.innerHTML).toBe('')
  })

  it('já instalado ou sem suporte: não oferece instalar', () => {
    for (const status of ['installed', 'unavailable']) {
      state.install = { status, install: vi.fn() }
      expect(mount(<PwaNotices />).container.innerHTML).toBe('')
      unmountAll()
    }
  })

  it('sem armazenamento (navegação privativa): não quebra e oferece de novo', () => {
    state.install = { status: 'promptable', install: vi.fn() }
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    const { container } = mount(<PwaNotices />)

    expect(container.textContent).toContain('Instale o Vagoo')
    spy.mockRestore()
  })
})
