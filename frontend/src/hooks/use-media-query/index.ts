import { useCallback, useSyncExternalStore } from 'react'

/**
 * A consulta de mídia casa agora? Acompanha mudanças (girar o aparelho, redimensionar a janela).
 * Fora do navegador, como na renderização dos testes, responde `false`.
 */
export const useMediaQuery = (query: string) => {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const media = window.matchMedia(query)
      media.addEventListener('change', onChange)
      return () => media.removeEventListener('change', onChange)
    },
    [query],
  )

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  )
}
