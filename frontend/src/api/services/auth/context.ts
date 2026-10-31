import type { CurrentUserResponse, UserBusinessResponse } from '@api/models'

/**
 * Contexto da conta (decisão de 22/09, §2.0, modelo iFood): a mesma pessoa pode ser consumidora e
 * dona, e escolhe explicitamente onde está. Aqui fica a regra de qual contexto abrir ao entrar.
 */

const LAST_CONTEXT_KEY = 'vagoo-last-context'

/** `customer` ou o id do estabelecimento, por conta. */
type Remembered = Record<string, string>

const CUSTOMER = 'customer'

const readAll = (): Remembered => {
  try {
    const raw = localStorage.getItem(LAST_CONTEXT_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? (parsed as Remembered) : {}
  } catch {
    // Aba privada, armazenamento bloqueado ou valor estragado: entra como se fosse a primeira vez.
    return {}
  }
}

/** Último contexto da conta: `'customer'`, o id de um estabelecimento ou `null` na primeira vez. */
export const readLastContext = (userId: string): string | null => readAll()[userId] ?? null

export const rememberContext = (userId: string, businessId: string | null) => {
  try {
    localStorage.setItem(
      LAST_CONTEXT_KEY,
      JSON.stringify({ ...readAll(), [userId]: businessId ?? CUSTOMER }),
    )
  } catch {
    // Sem armazenamento, só não lembra.
  }
}

/** Sair esquece o contexto lembrado de todas as contas deste aparelho. */
export const forgetContexts = () => {
  try {
    localStorage.removeItem(LAST_CONTEXT_KEY)
  } catch {
    // Nada a limpar.
  }
}

export type Entry =
  | { kind: 'customer' }
  | { kind: 'business'; business: UserBusinessResponse }
  /** Vários estabelecimentos e nada lembrado: a pessoa escolhe. */
  | { kind: 'choose' }

/**
 * O que a pessoa pediu ao entrar: `business` = escolheu "Sou estabelecimento"; `customer` = veio de
 * uma tela de consumidor (o agendamento que pediu login); `auto` = nada em especial.
 */
export type EntryIntent = 'auto' | 'business' | 'customer'

/**
 * Onde a conta entra depois do login.
 *
 * - Só consumidor → consumidor. Só estabelecimento, sem perfil de consumidor → o painel.
 * - Veio de uma tela de consumidor e tem perfil → consumidor, para terminar o que estava fazendo.
 * - Senão vale o último contexto lembrado ("Sou estabelecimento" ignora um "consumidor" lembrado).
 *   Na primeira vez de um dono, o painel.
 * - Vários estabelecimentos sem nada lembrado → a escolha.
 */
export const chooseEntry = (
  me: Pick<CurrentUserResponse, 'hasCustomerProfile' | 'businesses'>,
  last: string | null,
  intent: EntryIntent = 'auto',
): Entry => {
  const { businesses, hasCustomerProfile } = me
  if (businesses.length === 0) return { kind: 'customer' }
  if (intent === 'customer' && hasCustomerProfile) return { kind: 'customer' }

  const remembered = businesses.find(({ businessId }) => businessId === last)
  if (remembered) return { kind: 'business', business: remembered }
  if (last === CUSTOMER && hasCustomerProfile && intent !== 'business') return { kind: 'customer' }

  return businesses.length === 1
    ? { kind: 'business', business: businesses[0]! }
    : { kind: 'choose' }
}
