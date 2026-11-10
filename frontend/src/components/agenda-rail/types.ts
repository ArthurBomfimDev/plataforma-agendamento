/** `appointment` = atendimento; `break` = intervalo; `free` = o vão livre, onde fica a linha do agora. */
export type AgendaRailSlot = {
  kind: 'appointment' | 'break' | 'free'
  time: string
  label?: string
}

export type AgendaRailVertical = {
  id: string
  /** Nome da pílula do carrossel. */
  name: string
  business: string
  date: string
  hours: readonly string[]
  slots: readonly AgendaRailSlot[]
  freeToday: number
}

export type AgendaRailProps = {
  verticals: readonly AgendaRailVertical[]
  activeId: string
  /** Sentido da troca: 1 para a frente (padrão), -1 para trás. */
  direction?: number
  className?: string
}
