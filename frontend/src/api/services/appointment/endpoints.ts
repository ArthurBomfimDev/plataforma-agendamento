export const appointmentEndpoints = {
  request: '/api/appointments',
  mine: '/api/appointments/mine',
  cancel: (appointmentId: string) =>
    `/api/appointments/${encodeURIComponent(appointmentId)}/cancel`,
}
