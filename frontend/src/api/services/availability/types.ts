/** Um serviço, com um ou mais profissionais ("Sem preferência" consulta todos os habilitados). */
export type AvailabilityTarget = {
  businessId: string
  serviceId: string
  professionalIds: string[]
}

export type CalendarParams = { serviceId: string; professionalId: string; from: string; to: string }

export type DayParams = { serviceId: string; professionalId: string; date: string }
