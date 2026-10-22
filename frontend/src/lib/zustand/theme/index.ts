import { createJSONStorage, persist } from 'zustand/middleware'

import type { ThemeState } from './types'
import { create } from 'zustand'

/**
 * Chave no localStorage. O script inline do `index.html` lê a mesma chave para aplicar o tema
 * antes do React montar — mudou aqui, mude lá.
 */
export const THEME_STORAGE_KEY = 'vagoo-theme'

/** Preferência de tema, salva no localStorage. Quem aplica a classe `.dark` é o `useApplyTheme`. */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: THEME_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
)
