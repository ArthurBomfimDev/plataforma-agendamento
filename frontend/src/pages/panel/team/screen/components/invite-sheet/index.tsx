import { Button } from '@components/button'
import type { InviteSheetProps } from './types'
import { PanelSheet } from '@components/panel-sheet'
import { SelectField } from '@components/select-field'
import { TextField } from '@components/text-field'
import { isValidEmail } from '../../consts'
import { useState } from 'react'

const ROLE_OPTIONS = [
  { value: 'Professional', label: 'Profissional — atende e tem agenda própria' },
  {
    value: 'Attendant',
    label: 'Atendente — opera a agenda de todos, sem editar o estabelecimento',
  },
]

const NEW_PROFILE = ''

/**
 * Convidar alguém para a equipe por e-mail (ADR-029). O convite é um extra: o caminho principal continua sendo cadastrar
 * o profissional sem conta. O profissional pode ser ligado a um perfil que já existe ou ganhar um novo ao aceitar.
 */
export const InviteSheet = (props: InviteSheetProps) => {
  const { open, onOpenChange, linkable, onInvite } = props

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'Professional' | 'Attendant'>('Professional')
  const [professionalId, setProfessionalId] = useState(NEW_PROFILE)
  const [touched, setTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()

  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setName('')
      setEmail('')
      setRole('Professional')
      setProfessionalId(NEW_PROFILE)
      setTouched(false)
      setError(undefined)
    }
  }

  const nameError = touched && !name.trim() ? 'Informe o nome de quem você convida.' : undefined
  const emailError = touched && !isValidEmail(email) ? 'Informe um e-mail válido.' : undefined

  return (
    <PanelSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Convidar para a equipe"
      description="A pessoa recebe um link por e-mail, válido por 7 dias, para criar a conta ou entrar."
    >
      <form
        noValidate
        className="flex flex-col gap-(--space-16)"
        onSubmit={async (event) => {
          event.preventDefault()
          setTouched(true)
          if (!name.trim() || !isValidEmail(email)) return
          setSaving(true)
          setError(undefined)
          const failure = await onInvite({
            name: name.trim(),
            email: email.trim(),
            role,
            professionalId: role === 'Professional' && professionalId ? professionalId : null,
          })
          setSaving(false)
          if (failure) setError(failure)
        }}
      >
        <TextField
          id="invite-name"
          label="Nome"
          autoComplete="off"
          value={name}
          error={nameError}
          onChange={(event) => setName(event.target.value)}
        />
        <TextField
          id="invite-email"
          label="E-mail"
          type="email"
          inputMode="email"
          autoComplete="off"
          value={email}
          error={emailError}
          onChange={(event) => setEmail(event.target.value)}
        />
        <SelectField
          id="invite-role"
          label="Papel"
          options={ROLE_OPTIONS}
          value={role}
          onChange={(event) => setRole(event.target.value as 'Professional' | 'Attendant')}
        />
        {role === 'Professional' && (
          <SelectField
            id="invite-profile"
            label="Perfil de profissional"
            helper="Ligue a conta a um profissional que você já cadastrou, ou crie o perfil quando a pessoa aceitar."
            options={[
              { value: NEW_PROFILE, label: 'Criar um perfil novo ao aceitar' },
              ...linkable.map(({ id, name: profileName }) => ({ value: id, label: profileName })),
            ]}
            value={professionalId}
            onChange={(event) => setProfessionalId(event.target.value)}
          />
        )}

        {error && (
          <p role="alert" className="type-label text-(--status-rejected-fg)">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={saving}>
          {saving ? 'Enviando…' : 'Enviar convite'}
        </Button>
      </form>
    </PanelSheet>
  )
}
