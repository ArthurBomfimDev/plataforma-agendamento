import { NO_ROLE, ROLE_OPTIONS } from './consts'

import { Button } from '@components/button'
import type { InviteSheetProps } from './types'
import { PanelSheet } from '@components/panel-sheet'
import { SelectField } from '@components/select-field'
import { TextField } from '@components/text-field'
import { isValidEmail } from '../../consts'
import { useState } from 'react'

const NEW_PROFILE = ''

/**
 * Convidar alguém para a equipe por e-mail (ADR-029): é o único caminho para outra pessoa entrar. O perfil do profissional
 * nasce no aceite; o atendente não tem perfil. Quem já tem registro antigo, sem conta, pode ser ligado a ele aqui.
 */
export const InviteSheet = (props: InviteSheetProps) => {
  const { open, onOpenChange, linkable, onInvite } = props

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'Professional' | 'Attendant' | typeof NO_ROLE>(NO_ROLE)
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
      setRole(NO_ROLE)
      setProfessionalId(NEW_PROFILE)
      setTouched(false)
      setError(undefined)
    }
  }

  const nameError = touched && !name.trim() ? 'Informe o nome de quem você convida.' : undefined
  const emailError = touched && !isValidEmail(email) ? 'Informe um e-mail válido.' : undefined
  const roleError = touched && role === NO_ROLE ? 'Escolha o papel da pessoa.' : undefined

  return (
    <PanelSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Convidar profissional"
      description="A pessoa recebe um link por e-mail, válido por 7 dias, para criar a conta ou entrar. O perfil só nasce quando ela aceita."
    >
      <form
        noValidate
        className="flex flex-col gap-(--space-16)"
        onSubmit={async (event) => {
          event.preventDefault()
          setTouched(true)
          if (!name.trim() || !isValidEmail(email) || role === NO_ROLE) return
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
          error={roleError}
          onChange={(event) => setRole(event.target.value as 'Professional' | 'Attendant')}
        />
        {role === 'Professional' && linkable.length > 0 && (
          <SelectField
            id="invite-profile"
            label="Perfil de profissional"
            helper="Ligue a conta a um registro antigo, sem conta, ou deixe o perfil nascer quando a pessoa aceitar."
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
