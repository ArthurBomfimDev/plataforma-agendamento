import { format, parse } from 'date-fns'

/**
 * Fuso: a API manda instantes em UTC; a tela mostra no fuso IANA do estabelecimento — nunca no do
 * navegador e nunca com offset fixo (CLAUDE.md §5, horário de verão). `Intl` faz a conversão.
 */

const dateFormatters = new Map<string, Intl.DateTimeFormat>()
const timeFormatters = new Map<string, Intl.DateTimeFormat>()

const dateFormatter = (timeZone: string) => {
  let formatter = dateFormatters.get(timeZone)
  if (!formatter) {
    // `en-CA` formata como `yyyy-MM-dd`.
    formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    dateFormatters.set(timeZone, formatter)
  }
  return formatter
}

const timeFormatter = (timeZone: string) => {
  let formatter = timeFormatters.get(timeZone)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
    timeFormatters.set(timeZone, formatter)
  }
  return formatter
}

/** Dia do instante no fuso, `yyyy-MM-dd`. */
export const dateKeyIn = (instant: Date | string, timeZone: string) =>
  dateFormatter(timeZone).format(new Date(instant))

/** Horário do instante no fuso, `HH:mm`. */
export const timeIn = (instant: Date | string, timeZone: string) =>
  timeFormatter(timeZone).format(new Date(instant))

/** `yyyy-MM-dd` → meia-noite local, a forma de "dia" que o calendário e as telas usam. */
export const dayFromKey = (key: string) => parse(key, 'yyyy-MM-dd', new Date())

/** Meia-noite local → `yyyy-MM-dd`. */
export const keyFromDay = (day: Date) => format(day, 'yyyy-MM-dd')

/** "Hoje" no fuso do estabelecimento, como dia local. */
export const todayIn = (timeZone: string, now = new Date()) => dayFromKey(dateKeyIn(now, timeZone))

/** Diferença (ms) entre o relógio do fuso e o UTC naquele instante. */
const offsetAt = (instant: number, timeZone: string) => {
  const [date, time] = [dateKeyIn(new Date(instant), timeZone), timeIn(new Date(instant), timeZone)]
  const [y, m, d] = date.split('-').map(Number)
  const [h, mi] = time.split(':').map(Number)
  const asUtc = Date.UTC(y!, m! - 1, d!, h!, mi!)
  return asUtc - Math.floor(instant / 60_000) * 60_000
}

/**
 * `yyyy-MM-dd` + `HH:mm` no fuso do estabelecimento → instante ISO em UTC. Para a marcação de
 * balcão: o horário digitado é o do relógio do estabelecimento, nunca o do navegador.
 */
export const instantIn = (date: string, time: string, timeZone: string) => {
  const [y, m, d] = date.split('-').map(Number)
  const [h, mi] = time.split(':').map(Number)
  const wall = Date.UTC(y!, m! - 1, d!, h!, mi!)
  // Duas voltas acertam a virada do horário de verão, quando o offset muda no meio.
  let instant = wall - offsetAt(wall, timeZone)
  instant = wall - offsetAt(instant, timeZone)
  return new Date(instant).toISOString()
}

/** Fuso padrão enquanto o do estabelecimento não chegou — o mesmo default do backend. */
export const DEFAULT_TIME_ZONE = 'America/Sao_Paulo'
