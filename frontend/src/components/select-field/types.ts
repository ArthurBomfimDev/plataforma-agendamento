export type SelectOption<Value extends string> = { value: Value; label: string }

export type SelectFieldProps<Value extends string> = {
  id: string
  label: string
  value: Value
  options: ReadonlyArray<SelectOption<Value>>
  onValueChange: (value: Value) => void
  className?: string
  /** Classes do rótulo — por exemplo, a legenda menor dos formulários compactos. */
  labelClassName?: string
}
