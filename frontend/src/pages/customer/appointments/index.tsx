import { NAVIGATION_PATHS, ROUTES, signInPath } from '@router/paths'
import { useBusinesses } from '@api/services/business/hooks'
import { useCancelAppointment, useMyAppointments } from '@api/services/appointment/hooks'

import type { AppointmentsList } from './screen/types'
import { AppointmentsScreen } from './screen'
import { DEFAULT_TIME_ZONE } from '@utils/time-zone'
import { RequireCustomerContext } from '@router/guards/require-customer-context'
import { errorMessage } from '@api/base'
import { toCustomerAppointment } from '../adapters'
import { notify } from '@components/toaster/notify'
import { useNavigate } from 'react-router'
import { useSessionStore } from '@store/session'

/** "Meus agendamentos" é do consumidor: no contexto de estabelecimento, leva à troca de contexto. */
export const AppointmentsRoute = () => (
  <RequireCustomerContext>
    <Appointments />
  </RequireCustomerContext>
)

const Appointments = () => {
  const navigate = useNavigate()
  const signedIn = useSessionStore((state) => state.session !== null)
  const appointments = useMyAppointments()
  const cancel = useCancelAppointment()

  // A resposta traz só o id do estabelecimento; nome, endereço e fuso vêm da vitrine (em cache).
  const businessIds = [...new Set((appointments.data ?? []).map(({ businessId }) => businessId))]
  const businesses = useBusinesses(businessIds)
  const businessById = new Map(
    businesses.flatMap((query) => (query.data ? [[query.data.id, query.data] as const] : [])),
  )

  const list: AppointmentsList = !signedIn
    ? { status: 'signed-out', onSignIn: () => navigate(signInPath(ROUTES.appointments)) }
    : appointments.isError
      ? {
          status: 'error',
          message: errorMessage(appointments.error),
          onRetry: () => void appointments.refetch(),
        }
      : appointments.data && businesses.every((query) => !query.isPending)
        ? {
            status: 'ready',
            items: appointments.data.map((appointment) =>
              toCustomerAppointment(
                appointment,
                businessById.get(appointment.businessId),
                DEFAULT_TIME_ZONE,
              ),
            ),
          }
        : { status: 'loading' }

  return (
    <AppointmentsScreen
      list={list}
      onCancel={async (appointment) => {
        try {
          await cancel.mutateAsync(appointment.id)
          notify.success(
            appointment.status === 'pending' ? 'Pedido cancelado' : 'Agendamento cancelado',
          )
        } catch (error) {
          notify.error(error)
        }
      }}
      onNavigate={(item) => {
        const path = NAVIGATION_PATHS[item]
        if (path) navigate(path)
      }}
    />
  )
}
