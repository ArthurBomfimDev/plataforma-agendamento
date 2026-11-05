import { AUTH_LINK_CLASSES, AuthShell } from '@layouts/auth-layout'
import type { CreateAccountErrors, CreateAccountValues, InvitationScreenProps } from './types'
import { INVALID_MESSAGES, ROLE_LABELS, validateCreateAccount } from './consts'
import { useRef, useState } from 'react'

import { Button } from '@components/button'
import { Checkbox } from '@components/checkbox'
import { ErrorIcon } from '@assets/icons'
import { PASSWORD_MIN_LENGTH } from '@pages/auth/sign-in/screen/consts'
import { PasswordField } from '@components/password-field'
import { TextField } from '@components/text-field'

const TITLES = {
  loading: 'Convite',
  error: 'Convite',
  invalid: 'Convite indisponível',
  ready: 'Convite para a equipe',
} as const

/**
 * Destino do link do e-mail de convite (`#/convite?token=`, ADR-029). Quatro situações de quem abre o link: sem
 * conta (cria), com conta e sem sessão (entra), logado com o e-mail do convite (aceita) e logado com outro e-mail
 * (sai). O termo do profissional é obrigatório antes de concluir; o do atendente, não existe.
 */
export const InvitationScreen = (props: InvitationScreenProps) => {
  const { state, reason, message, preview, access, currentEmail, submitting, error } = props
  const { onCreateAccount, onAccept, onSignIn, onSignOut, onRetry, onHome } = props

  const [values, setValues] = useState<CreateAccountValues>({
    fullName: preview?.inviteeName ?? '',
    password: '',
    confirmation: '',
  })
  const [errors, setErrors] = useState<CreateAccountErrors>({})
  const [terms, setTerms] = useState(false)
  const refs = useRef<Partial<Record<keyof CreateAccountValues, HTMLInputElement | null>>>({})

  const termsRequired = preview?.termsRequired ?? false

  const field = (name: keyof CreateAccountValues) => ({
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

  const termsField = termsRequired && (
    <div className="flex flex-col gap-(--space-4)">
      <Checkbox
        checked={terms}
        onCheckedChange={(checked) => {
          setTerms(checked === true)
          setErrors((current) => ({ ...current, terms: undefined }))
        }}
        label={`Li e aceito o termo do profissional (versão ${preview?.termsVersion}, rascunho).`}
      />
      <p className="type-label text-(--text-muted)">
        Seu nome, especialidade, biografia e foto aparecem na página pública do estabelecimento.
        Você pode sair da equipe quando quiser.
      </p>
      {errors.terms && (
        <p role="alert" className="type-label text-(--status-rejected-fg)">
          {errors.terms}
        </p>
      )}
    </div>
  )

  const handleCreate = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validateCreateAccount(values, termsRequired, terms)
    setErrors(nextErrors)

    if (nextErrors.fullName) refs.current.fullName?.focus()
    else if (nextErrors.password) refs.current.password?.focus()
    else if (nextErrors.confirmation) refs.current.confirmation?.focus()
    else if (!nextErrors.terms && !submitting) {
      onCreateAccount?.({
        fullName: values.fullName.trim(),
        password: values.password,
        acceptTerms: terms,
      })
    }
  }

  const handleAccept = () => {
    if (termsRequired && !terms) {
      setErrors({ terms: validateCreateAccount(values, true, false).terms })
      return
    }
    if (!submitting) onAccept?.(terms)
  }

  const apiError = error && (
    <p role="alert" className="type-label text-(--status-rejected-fg)">
      {error}
    </p>
  )

  return (
    <AuthShell title={TITLES[state]}>
      {state === 'loading' && (
        <p role="status" aria-busy="true" className="type-body text-(--text-muted)">
          Carregando o convite…
        </p>
      )}

      {state === 'error' && (
        <>
          <p role="alert" className="type-body text-(--text-body)">
            {message ?? 'Não foi possível abrir o convite agora.'}
          </p>
          <Button size="lg" className="w-full" onClick={onRetry}>
            Tentar de novo
          </Button>
        </>
      )}

      {state === 'invalid' && (
        <>
          <p role="alert" className="type-body flex items-start gap-(--space-8) text-(--text-body)">
            <ErrorIcon
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-(--status-rejected-fg)"
            />
            {INVALID_MESSAGES[reason ?? 'not_found']}
          </p>
          {reason === 'used' && (
            <Button size="lg" className="w-full" onClick={onSignIn}>
              Entrar
            </Button>
          )}
          <Button size="lg" variant="ghost" className="w-full" onClick={onHome}>
            Ir para o início
          </Button>
        </>
      )}

      {state === 'ready' && preview && (
        <>
          <p className="type-body text-(--text-body)">
            <strong>{preview.inviterName}</strong> convidou você para entrar na equipe de{' '}
            <strong>{preview.businessName}</strong>, como {ROLE_LABELS[preview.role]}.
          </p>
          <p className="type-label text-(--text-muted)">
            Convite para <span className="break-all">{preview.email}</span>
          </p>

          {access === 'new' && (
            <form noValidate onSubmit={handleCreate} className="flex flex-col gap-(--space-16)">
              <div className="flex flex-col gap-(--space-12)">
                <TextField
                  {...field('fullName')}
                  id="invitation-name"
                  label="Seu nome"
                  autoComplete="name"
                />
                <PasswordField
                  {...field('password')}
                  id="invitation-password"
                  label="Senha"
                  autoComplete="new-password"
                  helper={`Mínimo ${PASSWORD_MIN_LENGTH} caracteres.`}
                />
                <PasswordField
                  {...field('confirmation')}
                  id="invitation-confirmation"
                  label="Confirme a senha"
                  autoComplete="new-password"
                />
              </div>
              {termsField}
              {apiError}
              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting ? 'Criando…' : 'Criar conta e aceitar'}
              </Button>
              <button type="button" className={AUTH_LINK_CLASSES} onClick={onSignIn}>
                Já tenho conta: Entrar
              </button>
            </form>
          )}

          {access === 'existing' && (
            <>
              <p className="type-body text-(--text-muted)">
                Já existe uma conta com este e-mail. Entre para aceitar o convite.
              </p>
              <Button size="lg" className="w-full" onClick={onSignIn}>
                Já tenho conta: Entrar
              </Button>
            </>
          )}

          {access === 'match' && (
            <>
              <p className="type-body text-(--text-muted)">
                Você está com a conta <span className="break-all">{currentEmail}</span>.
              </p>
              {termsField}
              {apiError}
              <Button size="lg" className="w-full" disabled={submitting} onClick={handleAccept}>
                {submitting ? 'Aceitando…' : 'Aceitar convite'}
              </Button>
            </>
          )}

          {access === 'other' && (
            <>
              <p
                role="alert"
                className="type-body flex items-start gap-(--space-8) text-(--text-body)"
              >
                <ErrorIcon
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-(--status-rejected-fg)"
                />
                <span>
                  Você está com a conta <span className="break-all">{currentEmail}</span>, mas este
                  convite é para <span className="break-all">{preview.email}</span>.
                </span>
              </p>
              <Button size="lg" className="w-full" onClick={onSignOut}>
                Sair e entrar com outra conta
              </Button>
            </>
          )}
        </>
      )}
    </AuthShell>
  )
}
