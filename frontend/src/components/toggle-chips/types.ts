export type ToggleChipsProps = {
  id: string
  /** Rótulo do grupo, visível. */
  legend: string
  options: ReadonlyArray<{ id: string; label: string }>
  selectedIds: ReadonlyArray<string>
  onToggle: (id: string) => void
  /** Texto quando não há opção. */
  empty: string
  disabled?: boolean
}
