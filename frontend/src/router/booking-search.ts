import { SEARCH_PARAMS } from './consts'

const validInstant = (value: string | null) => {
  if (!value) return null
  const instant = new Date(value)
  return Number.isNaN(instant.getTime()) ? null : instant
}

/**
 * Lê profissional e início do horário da busca da tela de revisão.
 * `null` quando faltam ou são inválidos — link montado à mão.
 */
export const readBookingSearch = (searchParams: URLSearchParams) => {
  const professionalId = searchParams.get(SEARCH_PARAMS.professional)
  const startsAtParam = searchParams.get(SEARCH_PARAMS.startsAt)
  const startsAt = validInstant(startsAtParam)

  if (!professionalId || !startsAt || !startsAtParam) return null

  return { professionalId, startsAt, startsAtParam }
}

/** Lê o agendamento criado e o instante do envio, da tela de pedido enviado. */
export const readSentSearch = (searchParams: URLSearchParams) => {
  const appointmentId = searchParams.get(SEARCH_PARAMS.appointment)
  const sentAt = validInstant(searchParams.get(SEARCH_PARAMS.sentAt))

  if (!appointmentId || !sentAt) return null

  return { appointmentId, sentAt }
}
