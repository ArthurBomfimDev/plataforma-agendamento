import { Navigate, useLocation } from 'react-router'
import { ROUTES, signInPath } from '../paths'

import type { ReactNode } from 'react'
import { useSessionStore } from '@store/session'

/** Sem sessão, manda para Entrar e volta para cá depois. Quem acabou de sair vai para a Home. */
export const RequireSession = ({ children }: { children: ReactNode }) => {
  const signedIn = useSessionStore((state) => state.session !== null)
  const signedOut = useSessionStore((state) => state.signedOut)
  const location = useLocation()

  if (!signedIn) {
    if (signedOut) return <Navigate to={ROUTES.home} replace />
    return <Navigate to={signInPath(`${location.pathname}${location.search}`)} replace />
  }

  return children
}
