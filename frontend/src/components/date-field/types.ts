export type DateFieldProps = {
  id: string
  label: string
  /** `yyyy-MM-dd`. Vazio = nenhuma data escolhida. */
  value: string
  onValueChange: (value: string) => void
  /** Primeiro dia que pode ser escolhido, `yyyy-MM-dd`. */
  fromDate?: string
  error?: string
  className?: string
  /** Classes do rótulo — por exemplo, a legenda menor dos formulários compactos. */
  labelClassName?: string
}
