import { createJSONStorage, persist } from 'zustand/middleware'

import type { SessionState } from './types'
import { create } from 'zustand'

const SESSION_STORAGE_KEY = 'vagoo-session'

/**
 * Sessão do consumidor: access token (JWT, curto) e refresh token (opaco, rotativo).
 *
 * Token e não cookie, pela regra 3 de empacotamento (CLAUDE.md §3): o mesmo build roda no Capacitor
 * e no Tauri, onde cookie cross-origin não funciona. Fica no localStorage — no shell nativo, troca
 * para o armazenamento seguro da plataforma atrás desta mesma store.
 */
export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
      clearSession: () => set({ session: null }),
    }),
    {
      name: SESSION_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ session: state.session }),
    },
  ),
)

/** Fora de componente (no cliente HTTP), sem assinar mudanças. */
export const getSession = () => useSessionStore.getState().session
