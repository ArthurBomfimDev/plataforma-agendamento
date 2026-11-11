import { useService, useServiceMutation } from '@api/base'

import { appointmentService } from '.'
import { queryKeys } from '../query-keys'
import { useSessionStore } from '@store/session'

/** Pedir ou cancelar muda as listas e libera ou ocupa um horário. */
const AFFECTED = [queryKeys.appointments, queryKeys.availability]

export const useMyAppointments = () =>
  useService({
    queryKey: queryKeys.myAppointments,
    service: async (signal) => (await appointmentService.mine(signal)).items,
    enabled: useSessionStore((state) => state.session !== null),
  })

export const useRequestAppointment = () =>
  useServiceMutation({ service: appointmentService.request, invalidates: AFFECTED })

export const useCancelAppointment = () =>
  useServiceMutation({ service: appointmentService.cancel, invalidates: AFFECTED })
