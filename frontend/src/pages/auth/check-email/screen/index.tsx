import { AUTH_LINK_CLASSES, AuthShell } from '@layouts/auth-layout'

import { Button } from '@components/button'
import type { CheckEmailScreenProps } from './types'
import { MarkEmailReadIcon } from '@assets/icons'
import { formatCountdown } from './consts'

/**
 * "Confira seu e-mail" (Onda 6A), logo depois de criar a conta. Sem frame no Figma: segue Entrar.
 *
 * A contagem regressiva fica fora da região viva — anunciar cada segundo atropelaria o leitor de
 * tela. Só o resultado do reenvio é anunciado.
 */
export const CheckEmailScreen = (props: CheckEmailScreenProps) => {
  const { email, secondsLeft, resending, status, error, onResend, onUseAnotherEmail, onSignIn } =
    props
  const waiting = secondsLeft > 0

  return (
    <AuthShell title="Confira seu e-mail">
      <div className="flex flex-col gap-(--space-12)">
        <MarkEmailReadIcon aria-hidden="true" className="size-10 text-(--text-link)" />
        <p className="type-body text-(--text-body)">
          {email ? (
            <>
              Enviamos um link de confirmação para{' '}
              <strong className="font-semibold break-all text-(--text-strong)">{email}</strong>.
            </>
          ) : (
            'Enviamos um link de confirmação para o e-mail do cadastro.'
          )}
        </p>
        <p className="type-body text-(--text-muted)">
          Abra o link para ativar a conta. Ele vale por 24 horas. Se não encontrar, olhe a caixa de
          spam.
        </p>
      </div>

      <div className="flex flex-col gap-(--space-12)">
        <p aria-live="polite" className="type-label text-(--text-muted) empty:hidden">
          {status}
        </p>
        {error && (
          <p role="alert" className="type-label text-(--status-rejected-fg)">
            {error}
          </p>
        )}
        <Button
          size="lg"
          variant="secondary"
          className="w-full"
          disabled={!email || waiting || resending}
          aria-describedby={waiting ? 'check-email-countdown' : undefined}
          onClick={onResend}
        >
          {resending ? 'Reenviando…' : 'Reenviar e-mail'}
        </Button>
        {waiting && (
          <p id="check-email-countdown" className="type-caption text-center text-(--text-muted)">
            Você pode reenviar em {formatCountdown(secondsLeft)}.
          </p>
        )}
        <Button size="lg" variant="ghost" className="w-full" onClick={onUseAnotherEmail}>
          Usar outro e-mail
        </Button>
      </div>

      <p className="type-label flex justify-center gap-(--space-4) text-(--text-muted)">
        Já confirmou?
        <button type="button" onClick={onSignIn} className={AUTH_LINK_CLASSES}>
          Entrar
        </button>
      </p>
    </AuthShell>
  )
}
