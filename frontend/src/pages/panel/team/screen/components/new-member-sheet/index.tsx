import { Button } from '@components/button'
import type { NewMemberSheetProps } from './types'
import { PanelSheet } from '@components/panel-sheet'
import { TextField } from '@components/text-field'
import { optional } from '../../consts'
import { useState } from 'react'

/** O dono que também atende cria o próprio perfil, ligado à conta dele. Qualquer outra pessoa entra por convite. */
export const NewMemberSheet = (props: NewMemberSheetProps) => {
  const { open, onOpenChange, onCreate } = props

  const [name, setName] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [touched, setTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()

  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setName('')
      setSpecialty('')
      setTouched(false)
      setError(undefined)
    }
  }

  const nameError = touched && !name.trim() ? 'Informe o nome que aparece na agenda.' : undefined

  return (
    <PanelSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Eu também atendo"
      description="Cria o seu perfil de profissional, ligado à sua conta."
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
            isMe: true,
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

        {error && (
          <p role="alert" className="type-label text-(--status-rejected-fg)">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={saving}>
          {saving ? 'Criando…' : 'Criar meu perfil'}
        </Button>
      </form>
    </PanelSheet>
  )
}
