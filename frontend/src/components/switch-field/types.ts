export type SwitchFieldProps = {
  id: string
  label: string
  /** Explica o efeito ("O pedido entra confirmado"). */
  description?: string
  checked: boolean
  disabled?: boolean
  onCheckedChange: (checked: boolean) => void
  className?: string
}
