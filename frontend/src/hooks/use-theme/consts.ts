import { useSyncExternalStore } from 'react'

export const DARK_QUERY = '(prefers-color-scheme: dark)'

export const subscribeToSystemTheme = (onChange: () => void) => {
  const media = window.matchMedia(DARK_QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

/** Se o sistema operacional está no modo escuro. Atualiza sozinho quando o sistema troca. */
export const usePrefersDark = () =>
  useSyncExternalStore(
    subscribeToSystemTheme,
    () => window.matchMedia(DARK_QUERY).matches,
    // Sem janela (render no servidor, testes) não há preferência: claro.
    () => false,
  )
