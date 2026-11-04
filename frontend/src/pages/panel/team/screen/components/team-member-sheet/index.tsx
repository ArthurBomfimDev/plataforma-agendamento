import {
  DECLARATION_REQUIRED_MESSAGE,
  DECLARATION_TEXT,
  draftOf,
  needsDeclaration,
  optional,
} from '../../consts'

import { Button } from '@components/button'
import { Checkbox } from '@components/checkbox'
import { PanelSheet } from '@components/panel-sheet'
import { SwitchField } from '@components/switch-field'
import { TextAreaField } from '@components/text-area-field'
import { TextField } from '@components/text-field'
import { ToggleChips } from '@components/toggle-chips'
import type { TeamMemberDraft } from '../../types'
import type { TeamMemberSheetProps } from './types'
import { useState } from 'react'

/**
 * Editar um profissional: perfil, situação e serviços. O perfil é sempre público (ADR-031). Para quem não tem login, salvar
 * a apresentação exige a declaração do dono de que tem a autorização da pessoa; quem tem login controla os próprios dados.
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
  // A declaração só vale para quem não tem login; é obrigatória quando há apresentação a salvar.
  const declarable = member !== null && !member.hasAccount
  const declarationError =
    touched &&
    draft &&
    member &&
    needsDeclaration(member, draft.bio) &&
    !draft.authorizationDeclared
      ? DECLARATION_REQUIRED_MESSAGE
      : undefined

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
            if (needsDeclaration(member, draft.bio) && !draft.authorizationDeclared) return
            setSaving(true)
            setError(undefined)
            const failure = await onSave({
              ...draft,
              displayName: draft.displayName.trim(),
              specialty: optional(draft.specialty ?? ''),
              bio: optional(draft.bio ?? ''),
              authorizationDeclared: declarable && draft.authorizationDeclared,
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
          {declarable && (
            <div className="flex flex-col gap-(--space-4)">
              <Checkbox
                checked={draft.authorizationDeclared}
                onCheckedChange={(checked) => set({ authorizationDeclared: checked === true })}
                label={DECLARATION_TEXT}
              />
              <p className="type-caption text-(--text-muted)">
                Especialidade, apresentação e foto ficam visíveis para qualquer pessoa. Fica
                registrado quem declarou e quando.
              </p>
              {declarationError && (
                <p role="alert" className="type-label text-(--status-rejected-fg)">
                  {declarationError}
                </p>
              )}
            </div>
          )}

          <SwitchField
            id="team-member-active"
            label="Ativo"
            description="Desativado, sai da agenda e da vitrine e não recebe pedidos novos."
            checked={draft.isActive}
            onCheckedChange={(isActive) => set({ isActive })}
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
