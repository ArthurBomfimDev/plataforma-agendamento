import { CircleAlert, CircleCheck, Loader2 } from 'lucide-react'

import { AuthShell } from '@components/auth-shell'
import { Button } from '@components/button'
import type { ConfirmEmailScreenProps } from './types'
import { TextField } from '@components/text-field'
import { isValidEmail } from '@features/sign-in/consts'
import { useState } from 'react'

const TITLES = {
  loading: 'Confirmando seu e-mail',
  success: 'E-mail confirmado',
  invalid: 'Link inválido',
} as const

/**
 * Destino do link de confirmação (`#/confirmar-email?token=`, e-mail da Onda 5B). Sem frame no
 * Figma: segue Entrar. O token não identifica a conta para o frontend, então o pedido de link novo
 * pergunta o e-mail.
 */
export const ConfirmEmailScreen = (props: ConfirmEmailScreenProps) => {
  const { state, onSignIn, onResend, resending, resent, resendError } = props
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string>()

  const handleResend = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isValidEmail(email)) {
      setEmailError('Informe um e-mail válido')
      return
    }
    if (!resending) onResend?.(email.trim())
  }

  return (
    <AuthShell title={TITLES[state]}>
      {state === 'loading' && (
        <p
          role="status"
          className="type-body flex items-center gap-(--space-8) text-(--text-muted)"
        >
          <Loader2 aria-hidden="true" className="size-5 animate-spin motion-reduce:animate-none" />
          Conferindo o link…
        </p>
      )}

      {state === 'success' && (
        <>
          <p
            role="status"
            className="type-body flex items-start gap-(--space-8) text-(--text-body)"
          >
            <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-(--text-link)" />
            Sua conta está ativa. Já pode entrar.
          </p>
          <Button size="lg" className="w-full" onClick={onSignIn}>
            Entrar
          </Button>
        </>
      )}

      {state === 'invalid' && (
        <>
          <p role="alert" className="type-body flex items-start gap-(--space-8) text-(--text-body)">
            <CircleAlert
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-(--status-rejected-fg)"
            />
            Este link expirou ou já foi usado. Peça um novo: ele vale por 24 horas.
          </p>

          {resent ? (
            <p role="status" className="type-body text-(--text-muted)">
              Se houver uma conta esperando confirmação com esse e-mail, enviamos um novo link.
            </p>
          ) : (
            <form noValidate onSubmit={handleResend} className="flex flex-col gap-(--space-16)">
              <TextField
                id="confirm-email-address"
                label="E-mail da conta"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="voce@exemplo.com"
                value={email}
                error={emailError}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setEmailError(undefined)
                }}
              />
              {resendError && (
                <p role="alert" className="type-label text-(--status-rejected-fg)">
                  {resendError}
                </p>
              )}
              <Button type="submit" size="lg" className="w-full" disabled={resending}>
                {resending ? 'Reenviando…' : 'Reenviar'}
              </Button>
            </form>
          )}

          <Button size="lg" variant="ghost" className="w-full" onClick={onSignIn}>
            Voltar para entrar
          </Button>
        </>
      )}
    </AuthShell>
  )
}
