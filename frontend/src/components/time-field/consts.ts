/** Passo padrão do produto: a granularidade de horário do estabelecimento (CLAUDE.md, calculador de disponibilidade). */
export const TIME_STEP_MINUTES = 15

/** Fim do dia como horário de jornada: a coluna de hora não guarda 24:00. */
export const END_OF_DAY = '23:59'

/**
 * Meia-noite como fim de jornada (`endOfDay="midnight"`): a API guarda `00:00` e a tela usa `24:00` (ver
 * `@utils/work-hours`). Bloqueios e feriados são instantes, não jornada, e seguem com `23:59`.
 */
export const MIDNIGHT = '24:00'

const pad = (value: number) => String(value).padStart(2, '0')

/** `HH:mm` ou `HH:mm:ss` → `HH:mm`. O que não for horário vira vazio. */
export const normalizeTime = (value: string) => {
  const match = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(value.trim())
  return match ? `${match[1]}:${match[2]}` : ''
}

/**
 * Os horários que a lista oferece, de `stepMinutes` em `stepMinutes`. `current` entra se estiver fora da grade (uma
 * jornada salva com 09:05, por exemplo): sumir com ele trocaria o horário da pessoa sem avisar.
 */
export const timeOptions = (
  stepMinutes: number = TIME_STEP_MINUTES,
  current?: string,
  { endOfDay = false }: { endOfDay?: boolean | 'midnight' } = {},
) => {
  const options: string[] = []
  for (let minute = 0; minute < 24 * 60; minute += stepMinutes) {
    options.push(`${pad(Math.floor(minute / 60))}:${pad(minute % 60)}`)
  }
  if (endOfDay === 'midnight') options.push(MIDNIGHT)
  else if (endOfDay) options.push(END_OF_DAY)

  const value = current ? normalizeTime(current) : ''
  if (value && !options.includes(value)) {
    options.push(value)
    options.sort()
  }
  return options
}
