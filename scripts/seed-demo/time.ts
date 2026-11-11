/** Instante UTC de uma hora de parede no fuso IANA — sem offset fixo, que quebra no horário de verão. */
export function zonedToUtc(date: string, time: string, timeZone: string): Date {
  const guess = new Date(`${date}T${time}Z`)
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
      .formatToParts(guess)
      .map((p) => [p.type, p.value]),
  )
  const asIfUtc = Date.UTC(+parts.year!, +parts.month! - 1, +parts.day!, +parts.hour!, +parts.minute!, +parts.second!)
  return new Date(guess.getTime() - (asIfUtc - guess.getTime()))
}

/** `base` (AAAA-MM-DD) deslocada em `days` dias de calendário. */
export function addDays(base: string, days: number): string {
  const date = new Date(`${base}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}
