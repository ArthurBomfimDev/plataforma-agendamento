export type DateNavigatorProps = {
  /** "sex, 11 set 2026", "8 a 14 de setembro de 2026", "setembro de 2026". */
  label: string
  /** Dia de referência, `yyyy-MM-dd`: o calendário abre nele. */
  date: string
  /** O período mostrado já contém hoje: "Hoje" fica desligado. */
  isCurrent: boolean
  previousLabel: string
  nextLabel: string
  onPrevious: () => void
  onNext: () => void
  onToday: () => void
  onPick: (date: string) => void
  className?: string
}
