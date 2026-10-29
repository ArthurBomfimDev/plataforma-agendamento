import type { ResolvedTheme } from '@lib/zustand/theme/types'
import { useEffect } from 'react'
import { usePrefersDark } from './consts'
import { useThemeStore } from '@lib/zustand/theme'

/** O tema que está de fato na tela: a escolha salva ou, em `system`, a do sistema operacional. */
export const useResolvedTheme = (): ResolvedTheme => {
  const theme = useThemeStore((state) => state.theme)
  const prefersDark = usePrefersDark()

  if (theme === 'system') return prefersDark ? 'dark' : 'light'
  return theme
}

/**
 * Liga a classe `.dark` em `<html>`, onde os tokens e as variáveis do shadcn resolvem. O
 * `color-scheme` faz o navegador acompanhar: barra de rolagem, autofill e controles nativos.
 * Chamar uma vez, na raiz do app.
 */
export const useApplyTheme = () => {
  const resolved = useResolvedTheme()

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', resolved === 'dark')
    root.style.colorScheme = resolved
  }, [resolved])
}
