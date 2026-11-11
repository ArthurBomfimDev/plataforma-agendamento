import type {
  CompleteProfileErrors,
  CompleteProfileScreenProps,
  CompleteProfileValues,
} from './types'
import { useRef, useState } from 'react'

import { Button } from '@components/button'
import { TextField } from '@components/text-field'
import { ThemeToggle } from '@components/theme-toggle'
import { format } from 'date-fns'
import { validateCompleteProfile } from './consts'

/**
 * Completar o cadastro de consumidor. Quem criou a conta pelo assistente de estabelecimento ou pelo convite não tem o
 * perfil; a data de nascimento é o que falta para agendar (idade mínima de 18 anos, ADR-012).
 *
 * TODO(figma): não há wireframe desta tela; segue os tokens e o formulário de criar conta.
 */
export const CompleteProfileScreen = (props: CompleteProfileScreenProps) => {
  const { data, onSubmit, submitting, error, onContinue } = props

  const [values, setValues] = useState<CompleteProfileValues>({ birthDate: '', socialName: '' })
  const [errors, setErrors] = useState<CompleteProfileErrors>({})
  const birthDateRef = useRef<HTMLInputElement | null>(null)

  const today = format(new Date(), 'yyyy-MM-dd')

  const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmed = { ...values, socialName: values.socialName.trim() }
    const nextErrors = validateCompleteProfile(trimmed, today)
    setErrors(nextErrors)

    if (nextErrors.birthDate) birthDateRef.current?.focus()
    else if (!submitting) onSubmit?.(trimmed)
  }

  return (
    <main className="min-h-dvh bg-(--bg-page) px-(--space-16) pt-[calc(var(--space-24)+env(safe-area-inset-top))] pb-[calc(var(--space-24)+env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-120 flex-col gap-(--space-16)">
        <div className="flex items-center justify-between gap-(--space-12)">
          <h1 className="type-heading text-(--text-strong)">Completar cadastro</h1>
          <ThemeToggle />
        </div>

        {data.status === 'loading' && (
          <p role="status" className="type-body text-(--text-muted)">
            Carregando…
          </p>
        )}

        {data.status === 'error' && (
          <div className="flex flex-col gap-(--space-12)">
            <p role="alert" className="type-body text-(--status-rejected-fg)">
              {data.message}
            </p>
            <Button variant="secondary" size="lg" className="w-full" onClick={data.onRetry}>
              Tentar de novo
            </Button>
          </div>
        )}

        {data.status === 'ready' && data.alreadyComplete && (
          <div className="flex flex-col gap-(--space-12)">
            <p className="type-body text-(--text-muted)">
              Seu cadastro de consumidor já está completo. Você pode agendar normalmente.
            </p>
            <Button size="lg" className="w-full" onClick={onContinue}>
              Continuar
            </Button>
          </div>
        )}

        {data.status === 'ready' && !data.alreadyComplete && (
          <>
            <p className="type-body text-(--text-muted)">
              {data.fullName}, para agendar como consumidor falta só a sua data de nascimento. Sua
              conta de estabelecimento continua como está.
            </p>

            <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-(--space-16)">
              <div className="flex flex-col gap-(--space-12)">
                <TextField
                  ref={birthDateRef}
                  id="complete-profile-birth-date"
                  label="Data de nascimento"
                  type="date"
                  max={today}
                  autoComplete="bday"
                  value={values.birthDate}
                  error={errors.birthDate}
                  helper="É preciso ter 18 anos ou mais para agendar."
                  onChange={(event) => {
                    setValues((current) => ({ ...current, birthDate: event.target.value }))
                    setErrors({})
                  }}
                />
                <TextField
                  id="complete-profile-social-name"
                  label="Nome social (opcional)"
                  autoComplete="nickname"
                  value={values.socialName}
                  helper="Se preencher, é o nome que aparece para o estabelecimento."
                  onChange={(event) =>
                    setValues((current) => ({ ...current, socialName: event.target.value }))
                  }
                />
              </div>

              {error && (
                <p role="alert" className="type-label text-(--status-rejected-fg)">
                  {error}
                </p>
              )}
              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting ? 'Salvando…' : 'Salvar e continuar'}
              </Button>
            </form>
          </>
        )}
      </div>
    </main>
  )
}
