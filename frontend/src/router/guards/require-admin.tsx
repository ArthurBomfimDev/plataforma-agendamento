import { Navigate, useLocation } from 'react-router'
import { ROUTES, signInPath } from '../paths'

import type { ReactNode } from 'react'
import { hasPlatformAdminRole } from '@utils/jwt'
import { useSessionStore } from '@store/session'

/**
 * Guard da área de Admin da plataforma, na tela: sem sessão leva a "Entrar" (e volta); sem o papel, à Home. É só
 * conveniência de interface: o token é lido sem validar a assinatura. Quem protege é o servidor, que recusa com
 * 403 toda rota `api/admin/*` de quem não é Admin (ADR-020).
 */
export const RequireAdmin = ({ children }: { children: ReactNode }) => {
  const token = useSessionStore((state) => state.session?.accessToken ?? null)
  const { pathname, search } = useLocation()

  if (token === null) return <Navigate to={signInPath(`${pathname}${search}`)} replace />
  if (!hasPlatformAdminRole(token)) return <Navigate to={ROUTES.home} replace />
  return children
}
