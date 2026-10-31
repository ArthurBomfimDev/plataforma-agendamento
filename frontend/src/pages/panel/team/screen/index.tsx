import { ACTIVE_BADGE, BADGE } from '@pages/panel/services/screen/consts'
import { ErrorState, LoadingState } from '@components/screen-state'
import { PANEL_CARD, PanelPage } from '@components/panel-page'
import type { TeamMember, TeamScreenProps } from './types'
import { byActiveThenName, servicesLabel, visibilityLabel } from './consts'

import { Avatar } from '@components/avatar'
import { Button } from '@components/button'
import { ConfirmDialog } from '@components/confirm-dialog'
import { NewMemberSheet } from './components/new-member-sheet'
import { TeamMemberSheet } from './components/team-member-sheet'
import { cn } from 'cn'
import { initials } from '@pages/panel/agenda/screen/consts'
import { mediaUrl } from '@api/services/media'
import { notify } from '@components/toaster/notify'
import { useState } from 'react'

/**
 * Painel — Profissionais (Onda 7D): a equipe, com editar, ativar e desativar e os serviços de cada um.
 * Só o dono (`RequireOwner`). Sem convite por e-mail: o profissional cadastrado aqui não tem login
 * (o convite é a Onda 5D).
 *
 * O perfil completo na vitrine depende do consentimento do próprio profissional (decisões de 22/09
 * §3): o dono vê o estado, mas não consegue ligar sem ele.
 */
export const TeamScreen = (props: TeamScreenProps) => {
  const { data, businessName, onCreate, onSave } = props

  const [editing, setEditing] = useState<TeamMember | null>(null)
  const [creating, setCreating] = useState(false)
  const [deactivating, setDeactivating] = useState<TeamMember | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const members = data.status === 'ready' ? data.members.toSorted(byActiveThenName) : []
  const services = data.status === 'ready' ? data.services : []
  const active = members.filter(({ isActive }) => isActive).length

  const setActive = async (member: TeamMember, isActive: boolean) => {
    setBusyId(member.id)
    try {
      const failure = await onSave?.(member, {
        displayName: member.displayName,
        specialty: member.specialty,
        bio: member.bio,
        isActive,
        // Desativado sai da vitrine; o domínio esconde o perfil, a tela não pede o contrário.
        showFullProfile: isActive && member.isPubliclyVisible,
        serviceIds: member.serviceIds,
      })
      if (failure) notify.error(failure)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <PanelPage
      title="Profissionais"
      subtitle={
        data.status === 'ready'
          ? `${active} ${active === 1 ? 'ativo' : 'ativos'} de ${members.length} · ${businessName}`
          : businessName
      }
      actions={
        <Button className="shrink-0" onClick={() => setCreating(true)}>
          Novo profissional
        </Button>
      }
    >
      {data.status === 'loading' ? (
        <LoadingState label="Carregando a equipe…" />
      ) : data.status === 'error' ? (
        <ErrorState message={data.message} onRetry={data.onRetry} />
      ) : members.length === 0 ? (
        <div className="flex flex-col items-start gap-(--space-8)">
          <p role="status" className="type-body text-(--text-muted)">
            Nenhum profissional cadastrado. Sem profissional, nenhum serviço tem horário.
          </p>
          <Button variant="secondary" onClick={() => setCreating(true)}>
            Cadastrar o primeiro profissional
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-(--space-12)">
          {members.map((member) => (
            <li key={member.id} className={PANEL_CARD}>
              <div className="flex items-start gap-(--space-12)">
                <Avatar
                  alt=""
                  src={member.photo ? mediaUrl(member.photo.small) : undefined}
                  initials={initials(member.displayName)}
                  size="md"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
                  <h2 className="type-label text-(--text-strong)">{member.displayName}</h2>
                  {member.specialty && (
                    <p className="type-caption text-(--text-body)">{member.specialty}</p>
                  )}
                  <p className="type-caption text-(--text-muted)">{visibilityLabel(member)}</p>
                </div>
                <span className={cn(BADGE, ACTIVE_BADGE[`${member.isActive}`])}>
                  {member.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <p className="type-caption text-(--text-muted)">{servicesLabel(member, services)}</p>
              <div className="flex flex-wrap gap-(--space-8)">
                <Button
                  variant="secondary"
                  aria-label={`Editar ${member.displayName}`}
                  onClick={() => setEditing(member)}
                >
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  disabled={busyId === member.id}
                  aria-label={`${member.isActive ? 'Desativar' : 'Ativar'} ${member.displayName}`}
                  onClick={() =>
                    member.isActive ? setDeactivating(member) : void setActive(member, true)
                  }
                >
                  {busyId === member.id ? 'Salvando…' : member.isActive ? 'Desativar' : 'Ativar'}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <TeamMemberSheet
        member={editing}
        services={services}
        onOpenChange={(open) => !open && setEditing(null)}
        onSave={async (draft) => {
          if (!editing) return 'Escolha um profissional.'
          const error = (await onSave?.(editing, draft)) ?? null
          if (!error) setEditing(null)
          return error
        }}
      />

      <NewMemberSheet
        open={creating}
        onOpenChange={setCreating}
        onCreate={async (draft) => {
          const error = (await onCreate?.(draft)) ?? null
          if (!error) setCreating(false)
          return error
        }}
      />

      <ConfirmDialog
        open={deactivating !== null}
        onOpenChange={(open) => !open && setDeactivating(null)}
        title="Desativar este profissional?"
        description={
          deactivating
            ? `${deactivating.displayName} sai da agenda e da vitrine, e não recebe pedidos novos. Os agendamentos já feitos continuam.`
            : ''
        }
        confirmLabel="Desativar profissional"
        dismissLabel="Manter ativo"
        onConfirm={() => {
          if (deactivating) void setActive(deactivating, false)
          setDeactivating(null)
        }}
      />
    </PanelPage>
  )
}
