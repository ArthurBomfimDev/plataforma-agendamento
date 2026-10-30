import { ErrorState, LoadingState } from '@components/screen-state'
import type { MyAccountScreenProps } from './types'
import { type PasswordErrors, validatePasswordChange } from './consts'

import { Button } from '@components/button'
import { LogOut } from 'lucide-react'
import { PasswordField } from '@components/password-field'
import { TextField } from '@components/text-field'
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
  const { data, onSignOut, onSwitchContext } = props

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
          </>
        )}

        <div className="flex flex-col gap-(--space-8)">
          {onSwitchContext && (
            <Button variant="secondary" size="lg" className="w-full" onClick={onSwitchContext}>
              Trocar de contexto
            </Button>
          )}
          <Button variant="ghost" size="lg" className="w-full" onClick={onSignOut}>
            <LogOut aria-hidden="true" className="size-4" />
            Sair
          </Button>
        </div>
      </div>
    </main>
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
