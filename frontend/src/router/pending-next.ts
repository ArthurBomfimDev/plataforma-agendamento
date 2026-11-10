import { safeNext } from './paths'

/**
 * Para onde levar a pessoa depois de confirmar o e-mail e entrar (ADR-034).
 *
 * O link de confirmação vem do e-mail e não carrega o destino. Quem cria conta pelo assistente de cadastro de
 * estabelecimento, ou entra para aceitar um convite com a conta ainda sem confirmação, precisa voltar ao ponto de onde
 * saiu. O destino fica guardado neste aparelho, e `readNext` só o devolve:
 *
 * - para o mesmo e-mail (outra pessoa que entre no mesmo navegador não é levada ao cadastro de alguém);
 * - por até 48 horas;
 * - se ainda passar pela lista fechada de `safeNext`, que é conferida de novo na leitura.
 *
 * O caminho do convite leva o token do convite. Ele fica só neste armazenamento: nunca em log, nunca em URL externa (o
 * destino é rota interna do `#`, que o navegador não envia ao servidor) e é apagado ao entrar. Armazenamento ausente
 * (aba anônima, dado bloqueado) não quebra nada: sem ele, a pessoa cai na Home e abre o link do e-mail de novo.
 */

const KEY = 'vagoo.next-after-confirmation'
export const NEXT_TTL_MS = 48 * 60 * 60 * 1000

type Stored = { email: string; path: string; savedAt: number }

const normalize = (email: string) => email.trim().toLowerCase()

export const rememberNext = (email: string, path: string | null | undefined, now = Date.now()) => {
  const safe = safeNext(path)
  if (!safe) return
  try {
    const stored: Stored = { email: normalize(email), path: safe, savedAt: now }
    localStorage.setItem(KEY, JSON.stringify(stored))
  } catch {
    // Sem armazenamento: a pessoa volta pelo link do e-mail.
  }
}

/** O destino guardado para este e-mail, se ainda valer. */
export const readNext = (email: string, now = Date.now()): string | null => {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const stored = JSON.parse(raw) as Partial<Stored>
    if (stored.email !== normalize(email)) return null
    if (typeof stored.savedAt !== 'number' || now - stored.savedAt > NEXT_TTL_MS) return null
    return safeNext(stored.path)
  } catch {
    return null
  }
}

export const clearNext = () => {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // Nada a fazer.
  }
}
