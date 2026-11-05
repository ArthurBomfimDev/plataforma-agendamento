import type { SignUpErrors, SignUpScreenProps, SignUpValues } from './types'
import { useRef, useState } from 'react'

import { Button } from '@components/button'
import { HeroPanel } from '@pages/auth/sign-in/screen/components/hero-panel'
import { Logotype } from '@components/logotype'
import { PASSWORD_MIN_LENGTH } from '@pages/auth/sign-in/screen/consts'
import { PasswordField } from '@components/password-field'
import { TextField } from '@components/text-field'
import { ThemeToggle } from '@components/theme-toggle'
import { format } from 'date-fns'
import { validateSignUp } from './consts'

const LINK_CLASSES =
  'type-label -my-(--space-12) py-(--space-12) text-(--text-link) hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)'

const FIELD_ORDER: (keyof SignUpValues)[] = [
  'fullName',
  'email',
  'password',
  'passwordConfirmation',
  'birthDate',
]

/**
 * Criar conta de consumidor (Figma, A02 — ainda sem frame; o layout segue o A01/A03 de Entrar).
 *
 * A data de nascimento entra porque o perfil de consumidor a exige (modelo de domínio, `Customer`).
 */
export const SignUpScreen = (props: SignUpScreenProps) => {
  const { onSubmit, submitting, error, onSignIn } = props

  const [values, setValues] = useState<SignUpValues>({
    fullName: '',
    email: '',
    password: '',
    passwordConfirmation: '',
    birthDate: '',
  })
  const [errors, setErrors] = useState<SignUpErrors>({})
  const refs = useRef<Partial<Record<keyof SignUpValues, HTMLInputElement | null>>>({})

  const today = format(new Date(), 'yyyy-MM-dd')

  const field = (name: keyof SignUpValues) => ({
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

    const trimmed = { ...values, fullName: values.fullName.trim(), email: values.email.trim() }
    const nextErrors = validateSignUp(trimmed, today)
    setErrors(nextErrors)

    const firstInvalid = FIELD_ORDER.find((name) => nextErrors[name])
    if (firstInvalid) refs.current[firstInvalid]?.focus()
    else if (!submitting) onSubmit?.(trimmed)
  }

  return (
    <main className="min-h-dvh bg-(--bg-surface) lg:flex">
      <HeroPanel />

      <div className="relative px-(--space-16) pt-(--space-24) pb-[calc(var(--space-16)+env(safe-area-inset-bottom))] lg:flex lg:min-w-0 lg:flex-1 lg:items-center lg:justify-center lg:p-(--space-40)">
        <ThemeToggle className="absolute top-(--space-16) right-(--space-16) lg:top-(--space-24) lg:right-(--space-24)" />

        <div className="mx-auto flex w-full max-w-md flex-col gap-(--space-16) lg:max-w-95.25">
          <div className="hidden self-start lg:block">
            <Logotype tone="auto" className="h-11.75" alt="" />
          </div>

          <div className="flex flex-col gap-(--space-4)">
            <h1 className="type-title text-(--text-strong) lg:text-(length:--size-display)! lg:leading-(--line-height-display)!">
              Criar conta
            </h1>
            <p className="type-body text-(--text-muted)">
              Crie sua conta para agendar seus serviços.
            </p>
          </div>

          <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-(--space-16)">
            <div className="flex flex-col gap-(--space-12)">
              <TextField
                {...field('fullName')}
                id="sign-up-name"
                label="Nome completo"
                autoComplete="name"
              />
              <TextField
                {...field('email')}
                id="sign-up-email"
                label="E-mail"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="voce@exemplo.com"
                helper="Usamos para confirmar e avisar sobre o pedido."
              />
              <PasswordField
                {...field('password')}
                id="sign-up-password"
                label="Senha"
                autoComplete="new-password"
                helper={`Mínimo ${PASSWORD_MIN_LENGTH} caracteres.`}
              />
              <PasswordField
                {...field('passwordConfirmation')}
                id="sign-up-password-confirmation"
                label="Confirme a senha"
                autoComplete="new-password"
              />
              <TextField
                {...field('birthDate')}
                id="sign-up-birth-date"
                label="Data de nascimento"
                type="date"
                max={today}
                autoComplete="bday"
              />
            </div>

            <div className="flex flex-col gap-(--space-16) lg:gap-(--space-12)">
              {error && (
                <p role="alert" className="type-label text-(--status-rejected-fg)">
                  {error}
                </p>
              )}
              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting ? 'Criando conta…' : 'Criar conta'}
              </Button>
              <p className="type-label flex justify-center gap-(--space-4) text-(--text-muted)">
                Já tem conta?
                <button type="button" onClick={onSignIn} className={LINK_CLASSES}>
                  Entrar
                </button>
              </p>
            </div>
          </form>

          <p className="type-caption text-center text-(--text-muted)">
            Ao continuar, você concorda com os Termos de Uso e a Política de Privacidade.
          </p>
        </div>
      </div>
    </main>
  )
}
