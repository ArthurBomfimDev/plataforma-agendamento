import { AuthShell } from '@components/auth-shell'
import { Button } from '@components/button'
import type { ForgotPasswordScreenProps } from './types'
import { TextField } from '@components/text-field'
import { isValidEmail } from '@features/sign-in/consts'
import { useState } from 'react'

/**
 * Esqueci minha senha (Figma A05, ainda sem frame implementado: segue Entrar). Pede o e-mail e manda
 * o link de redefinição. A resposta não diz se a conta existe.
 */
export const ForgotPasswordScreen = (props: ForgotPasswordScreenProps) => {
  const { onSubmit, submitting, sent, error, onBack } = props
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string>()

  const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isValidEmail(email)) {
      setEmailError('Informe um e-mail válido')
      return
    }
    if (!submitting) onSubmit?.(email.trim())
  }

  return (
    <AuthShell title="Esqueci minha senha">
      {sent ? (
        <p role="status" className="type-body text-(--text-body)">
          Se houver uma conta com esse e-mail, enviamos um link para criar uma senha nova. Ele vale
          por 1 hora.
        </p>
      ) : (
        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-(--space-16)">
          <p className="type-body text-(--text-muted)">
            Informe o e-mail da conta. Enviamos um link para você criar uma senha nova.
          </p>
          <TextField
            id="forgot-password-email"
            label="E-mail"
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
          {error && (
            <p role="alert" className="type-label text-(--status-rejected-fg)">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? 'Enviando…' : 'Enviar link'}
          </Button>
        </form>
      )}
      <Button size="lg" variant="ghost" className="w-full" onClick={onBack}>
        Voltar para entrar
      </Button>
    </AuthShell>
  )
}
