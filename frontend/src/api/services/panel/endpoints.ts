/**
 * Painel do estabelecimento. O estabelecimento vem do token (contexto), nunca da URL: o dono vê a
 * agenda toda; o profissional, só a própria — a API filtra.
 */
export const PANEL_PATH = '/api/businesses/current'

const appointments = `${PANEL_PATH}/appointments`

export const panelEndpoints = {
  business: PANEL_PATH,
  professionals: `${PANEL_PATH}/professionals`,
  workSchedules: `${PANEL_PATH}/work-schedules`,
  services: `${PANEL_PATH}/services`,
  appointments,
  pending: `${appointments}/pending`,
  counter: `${appointments}/counter`,
  appointmentAction: (appointmentId: string, action: string) =>
    `${appointments}/${encodeURIComponent(appointmentId)}/${action}`,
}
