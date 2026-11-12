/**
 * Fim de jornada à meia-noite. A API guarda `TimeOnly`, que não tem 24:00: o fim `00:00` (com início depois das 00:00)
 * quer dizer "fim do dia". Na tela é `24:00`, que ordena e soma como o último horário do dia; só na ida e na volta
 * da API vira `00:00`.
 */
export const END_OF_DAY = '24:00'

/** `HH:mm` ou `HH:mm:ss` do fim da jornada, como a tela o usa. */
export const endFromApi = (start: string, end: string) => {
  const edge = end.slice(0, 5)
  return edge === '00:00' && start.slice(0, 5) !== '00:00' ? END_OF_DAY : edge
}

/** O fim da jornada como a API o recebe: `HH:mm:ss`, com `24:00` virando `00:00:00`. */
export const endToApi = (end: string) => (end === END_OF_DAY ? '00:00:00' : `${end}:00`)
