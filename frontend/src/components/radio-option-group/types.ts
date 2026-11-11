export type RadioOption<Value extends string> = {
  value: Value
  label: string
  /** Explicação em `caption`, abaixo do rótulo. */
  description?: string
}

export type RadioOptionGroupProps<Value extends string> = {
  value: Value
  options: ReadonlyArray<RadioOption<Value>>
  onValueChange: (value: Value) => void
  /** Nome acessível do grupo, quando não há `aria-labelledby`. */
  'aria-label'?: string
  'aria-labelledby'?: string
  className?: string
}
