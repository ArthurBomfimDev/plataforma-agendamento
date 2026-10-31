import { Navigate, Outlet } from 'react-router'
import { ROUTES, canManageBusiness } from './consts'

import { usePanelContext } from './panel-context'

/**
 * Guard das telas de gestão (Onda 7D), dentro do `PanelLayout`: o profissional que digitar o endereço
 * volta para a agenda. O menu já esconde as seções; a API recusa com 403 do mesmo jeito.
 */
export const RequireOwner = () => {
  const panel = usePanelContext()

  return canManageBusiness(panel.context.role) ? (
    <Outlet context={panel} />
  ) : (
    <Navigate to={ROUTES.panel} replace />
  )
}
