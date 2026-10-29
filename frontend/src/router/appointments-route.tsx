import { NAVIGATION_PATHS, ROUTES, signInPath } from './consts'
import { useBusinesses, useCancelAppointment, useMyAppointments } from '@lib/api/queries'

import type { AppointmentsList } from '@features/appointments/types'
import { AppointmentsScreen } from '@features/appointments'
import { DEFAULT_TIME_ZONE } from '@lib/api/time'
import { RequireCustomerContext } from './require-customer-context'
import { errorMessage } from '@lib/api/errors'
import { toCustomerAppointment } from './adapters'
import { toast } from '@lib/toast'
import { useNavigate } from 'react-router'
import { useSessionStore } from '@lib/zustand/session'

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
          toast.success(
            appointment.status === 'pending' ? 'Pedido cancelado' : 'Agendamento cancelado',
          )
        } catch (error) {
          toast.error(errorMessage(error))
        }
      }}
      onNavigate={(item) => {
        const path = NAVIGATION_PATHS[item]
        if (path) navigate(path)
      }}
    />
  )
}
