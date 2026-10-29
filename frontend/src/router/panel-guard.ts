import type { BusinessContext } from '@lib/zustand/session/types'

/**
 * Quem pode abrir `/panel/*`: sessão com contexto de estabelecimento. Sem sessão, entrar; com sessão
 * mas como consumidor, a escolha de contexto (que diz "Esta conta não tem um estabelecimento" quando
 * não houver nenhum).
 */
export const panelAccess = (signedIn: boolean, context: BusinessContext | null) =>
  !signedIn ? 'sign-in' : context === null ? 'choose-context' : 'allowed'
