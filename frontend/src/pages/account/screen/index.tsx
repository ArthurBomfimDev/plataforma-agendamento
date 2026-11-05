import { ErrorState, LoadingState } from '@components/screen-state'
import type { ConsentsData, MyAccountScreenProps } from './types'
import { type PasswordErrors, validatePasswordChange } from './consts'
import { format } from 'date-fns'

import { Button } from '@components/button'
import { ConfirmDialog } from '@components/confirm-dialog'
import { LogoutIcon } from '@assets/icons'
import { PasswordField } from '@components/password-field'
import { TextField } from '@components/text-field'
import { ThemeToggle } from '@components/theme-toggle'
import { useState } from 'react'

const CARD =
  'flex flex-col gap-(--space-12) rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-(--space-16)'

/**
 * Minha conta (Onda 7CF): ver e trocar o nome, ver o e-mail, trocar a senha pedindo a atual e sair. Trocar a senha
 * encerra as sessões dos outros aparelhos; este continua.
 *
 * TODO(figma): não há wireframe desta tela; segue os tokens e o desenho da tela de conta (7A).
 * Fora do recorte: telefone (o cadastro não tem o campo), trocar o e-mail e excluir a conta.
 */
export const MyAccountScreen = (props: MyAccountScreenProps) => {
  const { data, onSignOut, onSwitchContext, onOpenPanel } = props
  const [confirmingSignOut, setConfirmingSignOut] = useState(false)

  return (
    <main className="min-h-dvh bg-(--bg-page) px-(--space-16) pt-[calc(var(--space-24)+env(safe-area-inset-top))] pb-[calc(var(--space-24)+env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-120 flex-col gap-(--space-16)">
        <h1 className="type-heading text-(--text-strong)">Minha conta</h1>

        {data.status === 'loading' ? (
          <LoadingState label="Carregando a conta…" />
        ) : data.status === 'error' ? (
          <ErrorState message={data.message} onRetry={data.onRetry} />
        ) : (
          <>
            <NameForm fullName={data.fullName} email={data.email} onSave={props.onSaveName} />
            <PasswordForm onChange={props.onChangePassword} />
            {props.consents && (
              <ConsentsCard consents={props.consents} onRevoke={props.onRevokeConsent} />
            )}
          </>
        )}

        <div className={`${CARD} flex-row items-center justify-between`}>
          <p className="type-label text-(--text-strong)">Tema escuro</p>
          <ThemeToggle />
        </div>

        <div className="flex flex-col gap-(--space-8)">
          {onOpenPanel && (
            <Button size="lg" className="w-full" onClick={onOpenPanel}>
              Meu painel
            </Button>
          )}
          {props.onRegisterBusiness && (
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={props.onRegisterBusiness}
            >
              Cadastrar meu estabelecimento
            </Button>
          )}
          {onSwitchContext && (
            <Button variant="secondary" size="lg" className="w-full" onClick={onSwitchContext}>
              Trocar de contexto
            </Button>
          )}
          <Button
            variant="ghost"
            size="lg"
            className="w-full"
            onClick={() => setConfirmingSignOut(true)}
          >
            <LogoutIcon aria-hidden="true" className="size-4" />
            Sair
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmingSignOut}
        onOpenChange={setConfirmingSignOut}
        title="Sair da conta?"
        description="Você precisará entrar de novo para ver seus agendamentos."
        confirmLabel="Sair"
        dismissLabel="Continuar na conta"
        onConfirm={onSignOut}
      />
    </main>
  )
}

const CONSENT_LABELS: Record<string, string> = {
  SensitiveScheduling: 'Agendar em estabelecimentos de saúde',
}

const dateLabel = (iso: string) => format(new Date(iso), 'dd/MM/yyyy')

/** Os consentimentos da conta. Revogar não cancela o que já foi agendado, mas bloqueia pedidos novos em Saúde. */
const ConsentsCard = (props: {
  consents: ConsentsData
  onRevoke: MyAccountScreenProps['onRevokeConsent']
}) => {
  const { consents, onRevoke } = props
  const [target, setTarget] = useState<string | null>(null)
  const [error, setError] = useState<string>()

  const revoke = async () => {
    if (!target) return
    setError(undefined)
    const failure = (await onRevoke?.(target)) ?? null
    setTarget(null)
    if (failure) setError(failure)
  }

  return (
    <section aria-labelledby="account-consents" className={CARD}>
      <h2 id="account-consents" className="type-label text-(--text-strong)">
        Consentimentos
      </h2>
      {consents.status === 'loading' && <LoadingState label="Carregando os consentimentos…" />}
      {consents.status === 'error' && (
        <ErrorState message={consents.message} onRetry={consents.onRetry} />
      )}
      {consents.status === 'ready' && consents.items.length === 0 && (
        <p className="type-body text-(--text-muted)">
          Você ainda não deu nenhum consentimento. Ele é pedido quando você agenda em saúde.
        </p>
      )}
      {consents.status === 'ready' && consents.items.length > 0 && (
        <ul className="flex flex-col gap-(--space-12)">
          {consents.items.map((consent) => (
            <li key={consent.id} className="flex flex-col items-start gap-(--space-4)">
              <p className="type-body text-(--text-strong)">
                {CONSENT_LABELS[consent.purpose] ?? consent.purpose}
              </p>
              <p className="type-caption text-(--text-muted)">
                {consent.revokedAt
                  ? `Revogado em ${dateLabel(consent.revokedAt)}`
                  : `Em vigor desde ${dateLabel(consent.grantedAt)}`}{' '}
                · versão {consent.version}
              </p>
              {!consent.revokedAt && (
                <Button variant="secondary" onClick={() => setTarget(consent.purpose)}>
                  Revogar
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      <Feedback error={error} />
      <ConfirmDialog
        open={target !== null}
        onOpenChange={(open) => !open && setTarget(null)}
        title="Revogar o consentimento?"
        description="Os agendamentos já feitos continuam. Novos pedidos em estabelecimentos de saúde ficam bloqueados até você consentir de novo."
        confirmLabel="Revogar"
        dismissLabel="Manter"
        onConfirm={() => void revoke()}
      />
    </section>
  )
}

const Feedback = ({ error, done }: { error?: string; done?: string }) =>
  error ? (
    <p role="alert" className="type-label text-(--status-rejected-fg)">
      {error}
    </p>
  ) : done ? (
    <p role="status" className="type-label text-(--status-confirmed-fg)">
      {done}
    </p>
  ) : null

const NameForm = (props: {
  fullName: string
  email: string
  onSave: MyAccountScreenProps['onSaveName']
}) => {
  const [name, setName] = useState(props.fullName)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()
  const [done, setDone] = useState<string>()
  const changed = name.trim() !== props.fullName

  return (
    <form
      noValidate
      aria-labelledby="account-data"
      className={CARD}
      onSubmit={async (event) => {
        event.preventDefault()
        setDone(undefined)
        if (!name.trim()) return setError('Informe seu nome.')
        setSaving(true)
        setError(undefined)
        const failure = await props.onSave(name.trim())
        setSaving(false)
        if (failure) setError(failure)
        else setDone('Nome salvo.')
      }}
    >
      <h2 id="account-data" className="type-label text-(--text-strong)">
        Seus dados
      </h2>
      <TextField
        id="account-name"
        label="Nome"
        autoComplete="name"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <div className="flex flex-col gap-(--space-2)">
        <p className="type-label text-(--text-body)">E-mail</p>
        <p className="type-body break-all text-(--text-strong)">{props.email}</p>
        <p className="type-caption text-(--text-muted)">
          Trocar o e-mail ainda não é possível pelo app.
        </p>
      </div>
      <Feedback error={error} done={done} />
      <Button type="submit" className="self-start" disabled={saving || !changed}>
        {saving ? 'Salvando…' : 'Salvar nome'}
      </Button>
    </form>
  )
}

const PasswordForm = (props: { onChange: MyAccountScreenProps['onChangePassword'] }) => {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<PasswordErrors>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()
  const [done, setDone] = useState<string>()

  return (
    <form
      noValidate
      aria-labelledby="account-password"
      className={CARD}
      onSubmit={async (event) => {
        event.preventDefault()
        setDone(undefined)
        const found = validatePasswordChange(current, next, confirm)
        setErrors(found)
        if (Object.keys(found).length > 0) return
        setSaving(true)
        setError(undefined)
        const failure = await props.onChange(current, next)
        setSaving(false)
        if (failure) return setError(failure)
        setCurrent('')
        setNext('')
        setConfirm('')
        setDone('Senha trocada. Os outros aparelhos precisam entrar de novo.')
      }}
    >
      <h2 id="account-password" className="type-label text-(--text-strong)">
        Trocar a senha
      </h2>
      <PasswordField
        id="account-current-password"
        label="Senha atual"
        autoComplete="current-password"
        value={current}
        error={errors.current}
        onChange={(event) => setCurrent(event.target.value)}
      />
      <PasswordField
        id="account-new-password"
        label="Senha nova"
        autoComplete="new-password"
        helper="De 8 a 128 caracteres."
        value={next}
        error={errors.next}
        onChange={(event) => setNext(event.target.value)}
      />
      <PasswordField
        id="account-confirm-password"
        label="Repita a senha nova"
        autoComplete="new-password"
        value={confirm}
        error={errors.confirm}
        onChange={(event) => setConfirm(event.target.value)}
      />
      <Feedback error={error} done={done} />
      <Button type="submit" className="self-start" disabled={saving}>
        {saving ? 'Trocando…' : 'Trocar a senha'}
      </Button>
    </form>
  )
}
