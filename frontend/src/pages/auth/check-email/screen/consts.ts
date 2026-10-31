/** Mesmo intervalo do backend (`IdentityPolicy.ConfirmationResendInterval`). */
export const RESEND_INTERVAL_SECONDS = 60

/** `45` → `0:45`. */
export const formatCountdown = (seconds: number) => {
  const safe = Math.max(0, Math.ceil(seconds))
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`
}

/** Segundos restantes até poder reenviar, a partir do instante do último envio. */
export const secondsUntilResend = (sentAt: number, now: number) =>
  Math.max(0, Math.ceil(RESEND_INTERVAL_SECONDS - (now - sentAt) / 1000))
