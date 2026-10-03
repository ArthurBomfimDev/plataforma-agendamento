import { Outlet, useMatch, useNavigate } from 'react-router'

import { ROUTES } from './consts'
import { TopBar } from '../components/top-bar'

/** Moldura comum a todas as telas: a barra superior do desktop. No celular ela não aparece. */
export const AppLayout = () => {
  const navigate = useNavigate()
  const isHome = useMatch(ROUTES.home) !== null

  return (
    <>
      <TopBar
        showSearch={!isHome}
        onHome={() => navigate(ROUTES.home)}
        onAppointments={() => navigate(ROUTES.appointments)}
      />
      <Outlet />
    </>
  )
}
