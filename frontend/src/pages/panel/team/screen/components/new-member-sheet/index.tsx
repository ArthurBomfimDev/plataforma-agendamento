import { Button } from '@components/button'
import type { NewMemberSheetProps } from './types'
import { PanelSheet } from '@components/panel-sheet'
import { SwitchField } from '@components/switch-field'
import { TextField } from '@components/text-field'
import { optional } from '../../consts'
import { useState } from 'react'

/**
 * Cadastrar um profissional sem login: o dono opera a agenda dele. O convite por e-mail, que dá login
 * ao profissional, é a Onda 5D.
 */
export const NewMemberSheet = (props: NewMemberSheetProps) => {
  const { open, onOpenChange, onCreate } = props

  const [name, setName] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [isMe, setIsMe] = useState(false)
  const [touched, setTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()

  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setName('')
      setSpecialty('')
      setIsMe(false)
      setTouched(false)
      setError(undefined)
    }
  }

  const nameError = touched && !name.trim() ? 'Informe o nome do profissional.' : undefined

  return (
    <PanelSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Novo profissional"
      description="Sem login: você opera a agenda dele. O convite por e-mail ainda não existe."
    >
      <form
        noValidate
        className="flex flex-col gap-(--space-16)"
        onSubmit={async (event) => {
          event.preventDefault()
          setTouched(true)
          if (!name.trim()) return
          setSaving(true)
          setError(undefined)
          const failure = await onCreate({
            displayName: name.trim(),
            specialty: optional(specialty),
            bio: null,
            isMe,
          })
          setSaving(false)
          if (failure) setError(failure)
        }}
      >
        <TextField
          id="new-member-name"
          label="Nome"
          autoComplete="off"
          value={name}
          error={nameError}
          onChange={(event) => setName(event.target.value)}
        />
        <TextField
          id="new-member-specialty"
          label="Especialidade (opcional)"
          autoComplete="off"
          value={specialty}
          onChange={(event) => setSpecialty(event.target.value)}
        />
        <SwitchField
          id="new-member-is-me"
          label="Sou eu: também atendo"
          description="Liga o profissional à sua conta."
          checked={isMe}
          onCheckedChange={setIsMe}
        />

        {error && (
          <p role="alert" className="type-label text-(--status-rejected-fg)">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={saving}>
          {saving ? 'Cadastrando…' : 'Cadastrar'}
        </Button>
      </form>
    </PanelSheet>
  )
}
