/**
 * Perfil de consumidor à espera da primeira entrada.
 *
 * Desde a Onda 6A, criar conta não abre sessão: o login só vale depois de confirmar o e-mail. O perfil de
 * consumidor (data de nascimento) precisa de sessão, então fica guardado aqui e é criado na primeira
 * entrada com o mesmo e-mail (`useSignIn`). Só neste aparelho: quem entra por outro aparelho fica sem perfil
 * até haver tela para completá-lo.
 *
 * Guarda o mínimo (e-mail e data) e apaga assim que usa. O armazenamento pode faltar (aba anônima, dado
 * bloqueado): toda leitura e escrita é protegida, e o cadastro funciona sem ele.
 */

const KEY = 'vagoo.pending-customer-profile'

type PendingProfile = { email: string; birthDate: string }

const normalize = (email: string) => email.trim().toLowerCase()

export const savePendingProfile = (email: string, birthDate: string) => {
  try {
    localStorage.setItem(KEY, JSON.stringify({ email: normalize(email), birthDate }))
  } catch {
    // Sem armazenamento: o perfil fica para depois.
  }
}

/** A data de nascimento guardada para este e-mail, se houver. */
export const readPendingProfile = (email: string): string | null => {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const pending = JSON.parse(raw) as Partial<PendingProfile>
    return pending.email === normalize(email) && typeof pending.birthDate === 'string'
      ? pending.birthDate
      : null
  } catch {
    return null
  }
}

export const clearPendingProfile = () => {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // Nada a fazer.
  }
}
