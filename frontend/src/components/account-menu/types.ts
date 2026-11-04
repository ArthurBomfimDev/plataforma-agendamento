/** Um contexto que a conta pode abrir: `customer` ou o id de um estabelecimento. */
export type AccountMenuItem = { id: string; label: string; current: boolean }

export type AccountMenuProps = {
  /** Texto do botão: o contexto atual ("Consumidor", "Painel: Estúdio Duartina"). */
  currentLabel: string
  /** Contextos disponíveis. Com um só, o menu mostra só o sair. */
  items: AccountMenuItem[]
  onSelect: (id: string) => void
  /** "Minha conta" (7CF): nome, e-mail, senha. */
  onAccount?: () => void
  /** "Meu painel": só para quem tem estabelecimento e está como consumidor. */
  onOpenPanel?: () => void
  /** "Cadastrar meu estabelecimento" (Fase 3). */
  onRegisterBusiness?: () => void
  /** "Administração": só para o Admin da plataforma. */
  onOpenAdmin?: () => void
  onSignOut: () => void
  /** Lado do botão em que o menu abre. Padrão: `end`. */
  align?: 'start' | 'end'
  /** Para cima (rodapé da barra lateral) ou para baixo (barra superior). Padrão: `bottom`. */
  side?: 'top' | 'bottom'
  className?: string
}
