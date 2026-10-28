export type TopBarProps = {
  /** A Home tem a busca no destaque da página; as outras telas a levam na barra. */
  showSearch?: boolean
  onHome?: () => void
  onAppointments?: () => void
  onSignIn?: () => void
  /** Com sessão, "Entrar" vira "Sair". */
  signedIn?: boolean
  onSignOut?: () => void
  /** Referência da busca ("Centro, Garça"); nula enquanto a pessoa não escolheu. */
  locationLabel?: string | null
  /** Abre o seletor de localização. */
  onChooseLocation?: () => void
}
