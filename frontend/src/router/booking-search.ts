import { isValid, parse } from 'date-fns'

import { SEARCH_PARAMS } from './consts'

/**
 * Lê profissional, dia e horário da busca das telas de revisão e de pedido enviado.
 * `null` quando o dia ou o horário faltam ou são inválidos — link montado à mão.
 */
export const readBookingSearch = (searchParams: URLSearchParams) => {
  const dateParam = searchParams.get(SEARCH_PARAMS.date) ?? ''
  const date = parse(dateParam, 'yyyy-MM-dd', new Date())
  const time = searchParams.get(SEARCH_PARAMS.time)

  if (!isValid(date) || !time) return null

  return { professionalId: searchParams.get(SEARCH_PARAMS.professional), date, dateParam, time }
}
