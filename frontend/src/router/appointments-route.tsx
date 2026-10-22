import { AppointmentsScreen } from '@features/appointments'
import { NAVIGATION_PATHS } from './consts'
import { useNavigate } from 'react-router'

export const AppointmentsRoute = () => {
  const navigate = useNavigate()

  return (
    <AppointmentsScreen
      onNavigate={(item) => {
        const path = NAVIGATION_PATHS[item]
        if (path) navigate(path)
      }}
    />
  )
}
