export type SettingRowProps = {
  label: string
  /** O valor atual, embaixo do rótulo. */
  value: string
  /** Texto curto à direita ("Ligado"), no lugar do chevron. */
  trailing?: string
  /** Com ação, a linha vira botão e mostra o chevron. */
  onClick?: () => void
  className?: string
}
