export type TopBarProps = {
  /** A Home tem a busca no destaque da página; as outras telas a levam na barra. */
  showSearch?: boolean
  onHome?: () => void
  onAppointments?: () => void
  onSignIn?: () => void
}
