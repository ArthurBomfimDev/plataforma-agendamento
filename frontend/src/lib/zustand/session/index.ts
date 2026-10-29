import { createJSONStorage, persist } from 'zustand/middleware'

import type { SessionState } from './types'
import { create } from 'zustand'

const SESSION_STORAGE_KEY = 'vagoo-session'

/**
 * Sessão: access token (JWT, curto), refresh token (opaco, rotativo) e o contexto ativo — consumidor
 * ou o painel de um estabelecimento.
 *
 * Token e não cookie, pela regra 3 de empacotamento (CLAUDE.md §3): o mesmo build roda no Capacitor
 * e no Tauri, onde cookie cross-origin não funciona. Fica no localStorage — no shell nativo, troca
 * para o armazenamento seguro da plataforma atrás desta mesma store.
 */
export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      session: null,
      context: null,
      signedOut: false,
      setSession: (session) => set({ session, signedOut: false }),
      setContext: (accessToken, accessTokenExpiresAt, context) =>
        set((state) =>
          state.session
            ? { session: { ...state.session, accessToken, accessTokenExpiresAt }, context }
            : state,
        ),
      clearSession: () => set({ session: null, context: null }),
      signOut: () => set({ session: null, context: null, signedOut: true }),
    }),
    {
      name: SESSION_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ session: state.session, context: state.context }),
    },
  ),
)

/** Fora de componente (no cliente HTTP), sem assinar mudanças. */
export const getSession = () => useSessionStore.getState().session

export const getContext = () => useSessionStore.getState().context
