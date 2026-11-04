import { PANEL_PATH } from '../panel/endpoints'

const enc = encodeURIComponent
const service = (serviceId: string) => `${PANEL_PATH}/services/${enc(serviceId)}`
const professional = (professionalId: string) =>
  `${PANEL_PATH}/professionals/${enc(professionalId)}`
const exceptions = `${PANEL_PATH}/schedule-exceptions`

export const managementEndpoints = {
  services: `${PANEL_PATH}/services`,
  service,
  serviceProfessional: (serviceId: string, professionalId: string) =>
    `${service(serviceId)}/professionals/${enc(professionalId)}`,
  professionals: `${PANEL_PATH}/professionals`,
  professional,
  professionalPhoto: (professionalId: string) => `${professional(professionalId)}/photo`,
  workSchedules: `${PANEL_PATH}/work-schedules`,
  workSchedule: (scheduleId: string) => `${PANEL_PATH}/work-schedules/${enc(scheduleId)}`,
  exceptions,
  exception: (exceptionId: string) => `${exceptions}/${enc(exceptionId)}`,
  affectedAppointments: `${exceptions}/affected-appointments`,
  policy: `${PANEL_PATH}/scheduling-policy`,
  businessImage: (slot: 'logo' | 'cover') => `${PANEL_PATH}/${slot}`,
}
