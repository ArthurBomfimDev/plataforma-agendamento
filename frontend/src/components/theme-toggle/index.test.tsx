import { afterEach, describe, expect, it } from 'vitest'

import { ThemeToggle } from '.'
import { renderToString } from 'react-dom/server'
import { useThemeStore } from '@lib/zustand/theme'

describe('ThemeToggle', () => {
  it('começa seguindo o sistema, que sem janela conta como claro', () => {
    expect(useThemeStore.getState().theme).toBe('system')
    expect(renderToString(<ThemeToggle />)).toMatch(
      /aria-label="Tema escuro"[^>]*aria-pressed="false"/,
    )
  })
})

// No render do servidor o zustand usa sempre o estado inicial; a troca se testa no próprio store.
describe('useThemeStore', () => {
  afterEach(() => useThemeStore.setState({ theme: 'system' }))

  it('guarda a escolha explícita de tema', () => {
    useThemeStore.getState().setTheme('dark')
    expect(useThemeStore.getState().theme).toBe('dark')

    useThemeStore.getState().setTheme('light')
    expect(useThemeStore.getState().theme).toBe('light')
  })
})
