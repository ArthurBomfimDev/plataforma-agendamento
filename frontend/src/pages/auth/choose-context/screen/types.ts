import type { AccountMenuItem } from '@components/account-menu/types'

export type ChooseContextScreenProps = {
  /** Carregando a conta, erro, ou pronta com os contextos. */
  status: 'loading' | 'error' | 'ready'
  errorMessage?: string
  onRetry?: () => void
  /** Nome da conta, no título. */
  fullName?: string
  items: AccountMenuItem[]
  /** Chegou aqui tentando abrir o painel. */
  fromPanel: boolean
  /** Chegou aqui de uma tela de consumidor, no contexto de estabelecimento. */
  fromCustomerScreen: boolean
  /** Uma troca em andamento: os botões não enviam de novo. */
  switching: boolean
  onChoose: (id: string) => void
  onSignOut: () => void
  /** Minha conta (7CF): nome, e-mail, senha. */
  onAccount?: () => void
}
