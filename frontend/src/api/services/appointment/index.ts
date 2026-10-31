import type { AppointmentResponse, PagedResult, RequestAppointmentRequest } from '@api/models'

import { appointmentEndpoints } from './endpoints'
import { authRequest } from '@api/base'

/** Agendamentos do consumidor. Os do estabelecimento ficam em `panelService`. */
export const appointmentService = {
  request: (request: RequestAppointmentRequest) =>
    authRequest<AppointmentResponse>({
      method: 'POST',
      url: appointmentEndpoints.request,
      data: request,
    }),
  mine: (signal?: AbortSignal) =>
    authRequest<PagedResult<AppointmentResponse>>({
      url: appointmentEndpoints.mine,
      params: { pageSize: 50 },
      signal,
    }),
  cancel: (appointmentId: string) =>
    authRequest<AppointmentResponse>({
      method: 'POST',
      url: appointmentEndpoints.cancel(appointmentId),
      data: { reason: null },
    }),
}
