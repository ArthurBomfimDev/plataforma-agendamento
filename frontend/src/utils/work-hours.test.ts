import { describe, expect, it } from 'vitest'
import { END_OF_DAY, endFromApi, endToApi } from './work-hours'

describe('fim de jornada à meia-noite', () => {
  it('o 00:00 da API, com início depois das 00:00, é o fim do dia na tela', () => {
    expect(endFromApi('18:00:00', '00:00:00')).toBe(END_OF_DAY)
    expect(endFromApi('18:00', '00:00')).toBe('24:00')
  })

  it('os outros fins ficam como vieram, sem os segundos', () => {
    expect(endFromApi('09:00:00', '18:30:00')).toBe('18:30')
    expect(endFromApi('09:00', '23:59')).toBe('23:59')
  })

  it('o fim do dia ordena depois de qualquer horário', () => {
    expect(['23:59', END_OF_DAY, '18:00'].sort().at(-1)).toBe(END_OF_DAY)
  })

  it('volta para a API como 00:00:00, e os outros horários ganham os segundos', () => {
    expect(endToApi('24:00')).toBe('00:00:00')
    expect(endToApi('18:30')).toBe('18:30:00')
  })
})
