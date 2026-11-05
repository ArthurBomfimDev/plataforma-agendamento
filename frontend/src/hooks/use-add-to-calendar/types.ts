export type CalendarEvent = {
  /** Identificador estável: o mesmo evento exportado duas vezes não duplica na agenda. */
  id: string
  title: string
  location?: string
  /** Dia, `yyyy-MM-dd`, e início, `HH:mm`, no fuso `timeZone`. */
  date: string
  time: string
  durationMinutes: number
  /** Fuso IANA do estabelecimento, por exemplo `America/Sao_Paulo`. Nunca offset fixo. */
  timeZone: string
}

/** Para onde "Adicionar à agenda" leva: o arquivo `.ics` (Apple e outros) ou o link pré-preenchido de cada agenda web. */
export type CalendarTarget = 'ics' | 'google' | 'outlook'
