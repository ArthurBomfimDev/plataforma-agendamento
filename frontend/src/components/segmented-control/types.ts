export type SegmentedControlOption<T extends string> = {
  value: T
  label: string
}

export type SegmentedControlProps<T extends string> = {
  /** Nome acessível do grupo — o Figma não mostra rótulo visível. */
  label: string
  options: readonly SegmentedControlOption<T>[]
  value: T
  onValueChange: (value: T) => void
  className?: string
}
