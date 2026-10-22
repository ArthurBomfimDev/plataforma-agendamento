import { Navigate, useLocation } from 'react-router'

import type { ReactNode } from 'react'
import { signInPath } from './consts'
import { useSessionStore } from '@lib/zustand/session'

/** Sem sessão, manda para Entrar e volta para cá depois. */
export const RequireSession = ({ children }: { children: ReactNode }) => {
  const signedIn = useSessionStore((state) => state.session !== null)
  const location = useLocation()

  if (!signedIn) {
    return <Navigate to={signInPath(`${location.pathname}${location.search}`)} replace />
  }

  return children
}
