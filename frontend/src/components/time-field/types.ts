export type TimeFieldProps = {
  id: string
  /** Rótulo visível sobre o campo. */
  label: string
  /** `HH:mm`, no fuso do estabelecimento. Vazio: nada escolhido. */
  value: string
  onValueChange: (value: string) => void
  /** Passo da lista em minutos. Padrão: 15, a granularidade do produto. */
  stepMinutes?: number
  /** Oferece 23:59 como "fim do dia" (campo de fim de bloqueio); `'midnight'` oferece 24:00 (fim de jornada). */
  endOfDay?: boolean | 'midnight'
  error?: string
  disabled?: boolean
  className?: string
  labelClassName?: string
}
