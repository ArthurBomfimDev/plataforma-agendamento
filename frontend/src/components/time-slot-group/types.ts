export type TimeSlotOption = {
  /** Horário já formatado no fuso do estabelecimento, por exemplo `09:30`. */
  time: string
  /** Horário que deixou de estar livre: aparece riscado e não pode ser escolhido. */
  unavailable?: boolean
}

export type TimeSlotGroupProps = {
  label: string
  slots: TimeSlotOption[]
  /** Horário escolhido, ou `null`. Pode estar em outro grupo — a escolha é única na tela toda. */
  value: string | null
  onValueChange: (time: string | null) => void
  className?: string
}
