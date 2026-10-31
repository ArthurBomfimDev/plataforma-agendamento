export type FilterMenuOption = { value: string; label: string }

export type FilterMenuProps = {
  /** Nome do filtro: "Profissional", "Status", "Serviço". Aparece na pílula enquanto não há escolha. */
  label: string
  /** Valor escolhido, ou `null` para "Todos". */
  value: string | null
  options: ReadonlyArray<FilterMenuOption>
  /** Rótulo da opção que limpa o filtro. Padrão: "Todos". */
  allLabel?: string
  onValueChange: (value: string | null) => void
}
