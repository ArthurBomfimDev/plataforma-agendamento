import { draftOf, optional } from '../../consts'

import { Button } from '@components/button'
import { PanelSheet } from '@components/panel-sheet'
import { SwitchField } from '@components/switch-field'
import { TextAreaField } from '@components/text-area-field'
import { TextField } from '@components/text-field'
import { ToggleChips } from '@components/toggle-chips'
import type { TeamMemberDraft } from '../../types'
import type { TeamMemberSheetProps } from './types'
import { useState } from 'react'

/**
 * Editar um profissional: perfil, situação, perfil público e serviços. O perfil completo na vitrine só
 * liga com o consentimento do próprio profissional; o dono vê o porquê, não um botão que falha.
 */
export const TeamMemberSheet = (props: TeamMemberSheetProps) => {
  const { member, services, onOpenChange, onSave } = props

  const [draft, setDraft] = useState<TeamMemberDraft | null>(member && draftOf(member))
  const [lastId, setLastId] = useState(member?.id)
  const [touched, setTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()

  // Cada abertura começa do profissional escolhido (a gaveta fica montada fechada).
  if (member?.id !== lastId) {
    setLastId(member?.id)
    setDraft(member && draftOf(member))
    setTouched(false)
    setError(undefined)
  }

  const set = (patch: Partial<TeamMemberDraft>) =>
    setDraft((current) => current && { ...current, ...patch })
  const nameError =
    touched && draft && !draft.displayName.trim() ? 'Informe o nome do profissional.' : undefined
  const consent = member?.hasPublicProfileConsent ?? false

  return (
    <PanelSheet
      open={member !== null}
      onOpenChange={onOpenChange}
      title={member ? `Editar ${member.displayName}` : 'Editar profissional'}
    >
      {member && draft && (
        <form
          noValidate
          className="flex flex-col gap-(--space-16)"
          onSubmit={async (event) => {
            event.preventDefault()
            setTouched(true)
            if (!draft.displayName.trim()) return
            setSaving(true)
            setError(undefined)
            const failure = await onSave({
              ...draft,
              displayName: draft.displayName.trim(),
              specialty: optional(draft.specialty ?? ''),
              bio: optional(draft.bio ?? ''),
              showFullProfile: draft.isActive && consent && draft.showFullProfile,
            })
            setSaving(false)
            if (failure) setError(failure)
          }}
        >
          <TextField
            id="team-member-name"
            label="Nome"
            autoComplete="off"
            value={draft.displayName}
            error={nameError}
            onChange={(event) => set({ displayName: event.target.value })}
          />
          <TextField
            id="team-member-specialty"
            label="Especialidade (opcional)"
            autoComplete="off"
            value={draft.specialty ?? ''}
            onChange={(event) => set({ specialty: event.target.value })}
          />
          <TextAreaField
            id="team-member-bio"
            label="Apresentação (opcional)"
            value={draft.bio ?? ''}
            onChange={(event) => set({ bio: event.target.value })}
          />

          <SwitchField
            id="team-member-active"
            label="Ativo"
            description="Desativado, sai da agenda e da vitrine e não recebe pedidos novos."
            checked={draft.isActive}
            onCheckedChange={(isActive) => set({ isActive })}
          />
          <SwitchField
            id="team-member-public"
            label="Perfil completo na vitrine"
            description={
              consent
                ? 'Especialidade, apresentação e foto aparecem para o consumidor.'
                : 'Precisa do consentimento do próprio profissional; o dono não pode dar por ele. Sem consentimento, a vitrine mostra só o nome.'
            }
            checked={consent && draft.isActive && draft.showFullProfile}
            disabled={!consent || !draft.isActive}
            onCheckedChange={(showFullProfile) => set({ showFullProfile })}
          />

          <ToggleChips
            id="team-member-services"
            legend="Serviços que executa"
            options={services.map(({ id, name, isActive }) => ({
              id,
              label: isActive ? name : `${name} (inativo)`,
            }))}
            selectedIds={draft.serviceIds}
            empty="Nenhum serviço cadastrado. Cadastre em Serviços."
            disabled={!draft.isActive}
            onToggle={(id) =>
              set({
                serviceIds: draft.serviceIds.includes(id)
                  ? draft.serviceIds.filter((serviceId) => serviceId !== id)
                  : [...draft.serviceIds, id],
              })
            }
          />
          {!draft.isActive && (
            <p className="type-caption text-(--text-muted)">
              Ative o profissional para mudar os serviços dele.
            </p>
          )}

          {error && (
            <p role="alert" className="type-label text-(--status-rejected-fg)">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar'}
          </Button>
        </form>
      )}
    </PanelSheet>
  )
}
