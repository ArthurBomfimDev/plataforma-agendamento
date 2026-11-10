import {
  EMPTY_INVITE,
  type InviteErrors,
  type InviteForm,
  ROLE_OPTIONS,
  SPECIALTY_MAX_LENGTH,
  asksSpecialty,
  toInviteDraft,
  validateInvite,
} from './consts'

import { Button } from '@components/button'
import type { InviteSheetProps } from './types'
import { PanelSheet } from '@components/panel-sheet'
import { SelectField } from '@components/select-field'
import { TextField } from '@components/text-field'
import { useState } from 'react'

const NEW_PROFILE = ''

/**
 * Convidar alguém para a equipe por e-mail (ADR-029): é o único caminho para outra pessoa entrar. O perfil do profissional
 * nasce no aceite, com a especialidade informada aqui; o atendente não tem perfil. Quem já tem registro antigo, sem
 * conta, pode ser ligado a ele aqui.
 */
export const InviteSheet = (props: InviteSheetProps) => {
  const { open, onOpenChange, linkable, onInvite } = props

  const [form, setForm] = useState<InviteForm>(EMPTY_INVITE)
  const [touched, setTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()

  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setForm(EMPTY_INVITE)
      setTouched(false)
      setError(undefined)
    }
  }

  const set = (patch: Partial<InviteForm>) => setForm((current) => ({ ...current, ...patch }))
  const errors: InviteErrors = touched ? validateInvite(form) : {}

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
          if (Object.keys(validateInvite(form)).length > 0) return
          setSaving(true)
          setError(undefined)
          const failure = await onInvite(toInviteDraft(form))
          setSaving(false)
          if (failure) setError(failure)
        }}
      >
        <TextField
          id="invite-name"
          label="Nome"
          autoComplete="off"
          value={form.name}
          error={errors.name}
          onChange={(event) => set({ name: event.target.value })}
        />
        <TextField
          id="invite-email"
          label="E-mail"
          type="email"
          inputMode="email"
          autoComplete="off"
          value={form.email}
          error={errors.email}
          onChange={(event) => set({ email: event.target.value })}
        />
        <SelectField
          id="invite-role"
          label="Papel"
          options={ROLE_OPTIONS}
          value={form.role}
          error={errors.role}
          onChange={(event) =>
            set({ role: event.target.value as InviteForm['role'], specialty: '' })
          }
        />
        {form.role === 'Professional' && linkable.length > 0 && (
          <SelectField
            id="invite-profile"
            label="Perfil de profissional"
            helper="Ligue a conta a um registro antigo, sem conta, ou deixe o perfil nascer quando a pessoa aceitar."
            options={[
              { value: NEW_PROFILE, label: 'Criar um perfil novo ao aceitar' },
              ...linkable.map(({ id, name: profileName }) => ({ value: id, label: profileName })),
            ]}
            value={form.professionalId}
            onChange={(event) => set({ professionalId: event.target.value })}
          />
        )}
        {asksSpecialty(form) && (
          <TextField
            id="invite-specialty"
            label="Especialidade"
            autoComplete="off"
            maxLength={SPECIALTY_MAX_LENGTH}
            placeholder="Ex.: Barbeiro, Manicure"
            helper="Aparece no perfil dela na página do estabelecimento. Ela pode mudar depois."
            value={form.specialty}
            error={errors.specialty}
            onChange={(event) => set({ specialty: event.target.value })}
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
