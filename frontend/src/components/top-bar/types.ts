import type { ReactNode } from 'react'

export type TopBarProps = {
  /** A Home tem a busca no destaque da página; as outras telas a levam na barra. */
  showSearch?: boolean
  onHome?: () => void
  onAppointments?: () => void
  /** "Para estabelecimentos" (ADR-034): sem sessão leva à página que explica; com sessão, ao assistente. */
  onForBusinesses?: () => void
  onSignIn?: () => void
  /** Com sessão, "Entrar" vira "Sair". */
  signedIn?: boolean
  onSignOut?: () => void
  /** Referência da busca ("Centro, Garça"); nula enquanto a pessoa não escolheu. */
  locationLabel?: string | null
  /** Abre o seletor de localização. */
  onChooseLocation?: () => void
  /** Envio da busca da barra, com o termo já sem espaços nas pontas. */
  onSearch?: (term: string) => void
  /** Com sessão, o menu da conta (troca de contexto e sair) no lugar do "Sair". */
  accountMenu?: ReactNode
  /** Com sessão, o sino de avisos, antes do tema. */
  notifications?: ReactNode
  /**
   * Contexto de estabelecimento (Onda 7A): a barra do consumidor some — busca, localização e
   * "Meus agendamentos" — e entra "Voltar ao painel".
   */
  onOpenPanel?: () => void
}
