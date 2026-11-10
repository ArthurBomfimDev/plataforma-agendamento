import { OWNER_ACCOUNT_FIELD_ORDER, validateOwnerAccount } from './consts'
import type { OwnerAccountErrors, OwnerAccountScreenProps, OwnerAccountValues } from './types'
import { useRef, useState } from 'react'

import { Button } from '@components/button'
import { Checkbox } from '@components/checkbox'
import { PASSWORD_MIN_LENGTH } from '@pages/auth/sign-in/screen/consts'
import { PasswordField } from '@components/password-field'
import { TextField } from '@components/text-field'
import { ThemeToggle } from '@components/theme-toggle'

const LINK_CLASSES =
  'type-label -my-(--space-12) min-w-(--size-touch-min) py-(--space-12) text-(--text-link) hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)'

/**
 * "Sua conta", o primeiro passo do cadastro de estabelecimento para quem ainda não tem sessão (ADR-034). É o mesmo
 * cadastro de conta de sempre, sem a data de nascimento: um modelo de usuário só, e a mesma conta pode agendar como
 * consumidor e administrar o estabelecimento. A conta nasce sem sessão; depois do e-mail confirmado, o cadastro continua
 * no passo "Negócio".
 */
export const OwnerAccountScreen = (props: OwnerAccountScreenProps) => {
  const { onSubmit, submitting, error, onSignIn } = props

  const [values, setValues] = useState<OwnerAccountValues>({
    fullName: '',
    email: '',
    password: '',
  })
  const [terms, setTerms] = useState(false)
  const [errors, setErrors] = useState<OwnerAccountErrors>({})
  const refs = useRef<Partial<Record<keyof OwnerAccountValues, HTMLInputElement | null>>>({})
  const termsRef = useRef<HTMLDivElement>(null)

  const field = (name: keyof OwnerAccountValues) => ({
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
    const nextErrors = validateOwnerAccount(trimmed, terms)
    setErrors(nextErrors)

    const first = OWNER_ACCOUNT_FIELD_ORDER.find((name) => nextErrors[name])
    if (first === 'terms') termsRef.current?.querySelector('button')?.focus()
    else if (first) refs.current[first]?.focus()
    else if (!submitting) onSubmit?.(trimmed)
  }

  return (
    <main className="min-h-dvh bg-(--bg-page) px-(--space-16) pt-[calc(var(--space-24)+env(safe-area-inset-top))] pb-[calc(var(--space-24)+env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-120 flex-col gap-(--space-16)">
        <header className="flex flex-col gap-(--space-4)">
          <div className="flex items-center justify-between gap-(--space-12)">
            <p className="type-caption tabular min-w-0 text-(--text-muted)">
              Primeiro passo · Sua conta
            </p>
            <ThemeToggle />
          </div>
          <h1 className="type-heading text-(--text-strong)">Cadastrar meu estabelecimento</h1>
          <p className="type-body text-(--text-muted)">
            Você usa a mesma conta para agendar como consumidor e para cuidar do seu
            estabelecimento. Depois de criá-la, confirmamos o seu e-mail e o cadastro continua.
          </p>
        </header>

        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-(--space-16)">
          <div className="flex flex-col gap-(--space-12)">
            <TextField
              {...field('fullName')}
              id="owner-account-name"
              label="Nome completo"
              autoComplete="name"
            />
            <TextField
              {...field('email')}
              id="owner-account-email"
              label="E-mail"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="voce@exemplo.com"
              helper="Enviamos o link de confirmação para ele."
            />
            <PasswordField
              {...field('password')}
              id="owner-account-password"
              label="Senha"
              autoComplete="new-password"
              helper={`De ${PASSWORD_MIN_LENGTH} a 128 caracteres.`}
            />

            <div ref={termsRef} className="flex flex-col gap-(--space-4)">
              <Checkbox
                id="owner-account-terms"
                checked={terms}
                onCheckedChange={(checked) => {
                  setTerms(checked === true)
                  setErrors((current) => ({ ...current, terms: undefined }))
                }}
                label="Li e aceito os Termos de Uso e a Política de Privacidade."
              />
              {errors.terms && (
                <p role="alert" className="type-label text-(--status-rejected-fg)">
                  {errors.terms}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-(--space-12)">
            {error && (
              <p role="alert" className="type-label text-(--status-rejected-fg)">
                {error}
              </p>
            )}
            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? 'Criando conta…' : 'Criar conta e continuar'}
            </Button>
            <p className="type-label flex justify-center gap-(--space-4) text-(--text-muted)">
              Já tenho conta:
              <button type="button" onClick={onSignIn} className={LINK_CLASSES}>
                entrar
              </button>
            </p>
          </div>
        </form>
      </div>
    </main>
  )
}
