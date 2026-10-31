import type { ResetPasswordErrors, ResetPasswordScreenProps, ResetPasswordValues } from './types'
import { useRef, useState } from 'react'

import { AuthShell } from '@components/auth-shell'
import { Button } from '@components/button'
import { CircleAlert } from 'lucide-react'
import { PASSWORD_MIN_LENGTH } from '@features/sign-in/consts'
import { PasswordField } from '@components/password-field'
import { validateResetPassword } from './consts'

const TITLES = {
  form: 'Nova senha',
  success: 'Senha alterada',
  invalid: 'Link inválido',
} as const

/**
 * Destino do link de redefinição (`#/redefinir-senha?token=`, e-mail da Onda 5B). Sem frame no
 * Figma: segue Entrar. Trocar a senha encerra as outras sessões (backend).
 */
export const ResetPasswordScreen = (props: ResetPasswordScreenProps) => {
  const { state, onSubmit, submitting, error, onSignIn, onRequestNewLink } = props
  const [values, setValues] = useState<ResetPasswordValues>({ password: '', confirmation: '' })
  const [errors, setErrors] = useState<ResetPasswordErrors>({})
  const refs = useRef<Partial<Record<keyof ResetPasswordValues, HTMLInputElement | null>>>({})

  const field = (name: keyof ResetPasswordValues) => ({
    ref: (element: HTMLInputElement | null) => {
      refs.current[name] = element
    },
    value: values[name],
    error: errors[name],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues((current) => ({ ...current, [name]: event.target.value }))
      setErrors((current) => ({ ...current, [name]: undefined }))
    },
  })

  const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validateResetPassword(values)
    setErrors(nextErrors)

    if (nextErrors.password) refs.current.password?.focus()
    else if (nextErrors.confirmation) refs.current.confirmation?.focus()
    else if (!submitting) onSubmit?.(values.password)
  }

  return (
    <AuthShell title={TITLES[state]}>
      {state === 'form' && (
        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-(--space-16)">
          <p className="type-body text-(--text-muted)">
            Escolha uma senha nova. Ao salvar, as outras sessões abertas são encerradas.
          </p>
          <div className="flex flex-col gap-(--space-12)">
            <PasswordField
              {...field('password')}
              id="reset-password-new"
              label="Nova senha"
              autoComplete="new-password"
              helper={`Mínimo ${PASSWORD_MIN_LENGTH} caracteres.`}
            />
            <PasswordField
              {...field('confirmation')}
              id="reset-password-confirmation"
              label="Confirme a nova senha"
              autoComplete="new-password"
            />
          </div>
          {error && (
            <p role="alert" className="type-label text-(--status-rejected-fg)">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? 'Salvando…' : 'Salvar nova senha'}
          </Button>
        </form>
      )}

      {state === 'success' && (
        <>
          <p role="status" className="type-body text-(--text-body)">
            Sua senha foi alterada. Entre com a senha nova.
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
            Este link expirou ou já foi usado. O link de redefinição vale por 1 hora.
          </p>
          <Button size="lg" className="w-full" onClick={onRequestNewLink}>
            Pedir novo link
          </Button>
          <Button size="lg" variant="ghost" className="w-full" onClick={onSignIn}>
            Voltar para entrar
          </Button>
        </>
      )}
    </AuthShell>
  )
}
