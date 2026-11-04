import { Navigate, Outlet } from 'react-router'

import type { BusinessRole } from '@api/models'
import { ROUTES } from '../paths'
import { usePanelContext } from '@layouts/panel-layout/context'

/**
 * Guard das telas de um papel só (ou de dois), dentro do `PanelLayout`: quem tem outro papel e digita o endereço volta
 * para a agenda. O menu já esconde a seção; a API recusa com 403 do mesmo jeito.
 */
export const RequireRoles = ({ allow }: { allow: ReadonlyArray<BusinessRole> }) => {
  const panel = usePanelContext()

  return allow.includes(panel.context.role) ? (
    <Outlet context={panel} />
  ) : (
    <Navigate to={ROUTES.panel} replace />
  )
}
