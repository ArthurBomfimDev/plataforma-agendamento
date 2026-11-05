import { ErrorState, LoadingState } from '@components/screen-state'
import type { TeamMember, TeamScreenProps } from './types'
import { byActiveThenName, subtitleOf } from './consts'

import { Button } from '@components/button'
import { ConfirmDialog } from '@components/confirm-dialog'
import { MemberDetail } from './components/member-detail'
import { InviteSheet } from './components/invite-sheet'
import { InvitesCard } from './components/invites-card'
import { NewMemberSheet } from './components/new-member-sheet'
import { PageTransition } from '@components/page-transition'
import { PanelPage } from '@components/panel-page'
import { TeamList } from './components/team-list'
import { TeamMemberSheet } from './components/team-member-sheet'
import { cn } from 'cn'
import { notify } from '@components/toaster/notify'
import { useState } from 'react'

/**
 * Painel — Profissionais (Onda 7D, Figma 17): a equipe à esquerda e a ficha do selecionado à direita, com
 * editar, desativar e os serviços de cada um. Só o dono (`RequireOwner`). Sem convite por e-mail: o
 * profissional cadastrado aqui não tem login (o convite é a Onda 5D).
 *
 * No celular e no tablet a tela mostra uma coluna por vez: a lista e, ao escolher alguém, a ficha dele.
 *
 * O perfil é sempre público (ADR-031): para quem não tem login, o dono declara a autorização da pessoa ao salvar a
 * apresentação.
 */
export const TeamScreen = (props: TeamScreenProps) => {
  const { data, businessName, onCreate, onSave, onOpenSchedules } = props
  const { invites, onInvite, onResendInvite, onRevokeInvite, showRegistration = false } = props

  const [inviting, setInviting] = useState(false)
  const [selectedId, setSelectedId] = useState<string>()
  const [showDetail, setShowDetail] = useState(false)
  const [editing, setEditing] = useState<TeamMember | null>(null)
  const [creating, setCreating] = useState(false)
  const [deactivating, setDeactivating] = useState<TeamMember | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const members = data.status === 'ready' ? data.members.toSorted(byActiveThenName) : []
  const services = data.status === 'ready' ? data.services : []
  // Sem escolha (ou com o escolhido fora da lista), o primeiro da equipe fica aberto no desktop.
  const selected = members.find(({ id }) => id === selectedId) ?? members[0]

  const setActive = async (member: TeamMember, isActive: boolean) => {
    setBusyId(member.id)
    try {
      const failure = await onSave?.(member, {
        displayName: member.displayName,
        specialty: member.specialty,
        bio: member.bio,
        isActive,
        // Desativado sai da vitrine na hora. A declaração já registrada não se refaz ao ativar ou desativar.
        authorizationDeclared: false,
        registration: member.registration,
        serviceIds: member.serviceIds,
      })
      if (failure) notify.error(failure)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <PanelPage
      wide
      title="Profissionais"
      subtitle={data.status === 'ready' ? subtitleOf(members, businessName) : businessName}
    >
      {data.status === 'loading' ? (
        <LoadingState label="Carregando a equipe…" />
      ) : data.status === 'error' ? (
        <ErrorState message={data.message} onRetry={data.onRetry} />
      ) : !selected ? (
        <div className="flex flex-col items-start gap-(--space-8)">
          <p role="status" className="type-body text-(--text-muted)">
            Nenhum profissional cadastrado. Sem profissional, nenhum serviço tem horário.
          </p>
          <Button variant="secondary" onClick={() => setCreating(true)}>
            Cadastrar o primeiro profissional
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-(--space-24) lg:flex-row lg:items-start">
          <div className={cn('lg:w-80 lg:shrink-0', showDetail && 'hidden lg:block')}>
            <TeamList
              members={members}
              services={services}
              selectedId={selected.id}
              onSelect={(id) => {
                setSelectedId(id)
                setShowDetail(true)
              }}
              onNew={() => setCreating(true)}
            />
          </div>
          <div className={cn('min-w-0 lg:flex-1', !showDetail && 'hidden lg:block')}>
            <PageTransition transitionKey={selected.id}>
              <MemberDetail
                member={selected}
                services={services}
                busy={busyId === selected.id}
                onBack={() => setShowDetail(false)}
                onEdit={() => setEditing(selected)}
                onOpenSchedules={onOpenSchedules}
                onDeactivate={() => setDeactivating(selected)}
                onActivate={() => void setActive(selected, true)}
              />
            </PageTransition>
          </div>
        </div>
      )}

      {invites && data.status === 'ready' && (
        <InvitesCard
          data={invites}
          onInvite={() => setInviting(true)}
          onResend={async (id) => (await onResendInvite?.(id)) ?? null}
          onRevoke={async (id) => (await onRevokeInvite?.(id)) ?? null}
        />
      )}

      <InviteSheet
        open={inviting}
        onOpenChange={setInviting}
        linkable={members
          .filter((member) => member.isActive && !member.hasAccount)
          .map(({ id, displayName }) => ({ id, name: displayName }))}
        onInvite={async (draft) => {
          const error = (await onInvite?.(draft)) ?? null
          if (!error) setInviting(false)
          return error
        }}
      />

      <TeamMemberSheet
        member={editing}
        services={services}
        showRegistration={showRegistration}
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
        title="Remover da equipe?"
        description={
          deactivating
            ? `${deactivating.displayName} sai da agenda e da vitrine, e não recebe pedidos novos. Os agendamentos já feitos continuam e o histórico fica nos relatórios.`
            : ''
        }
        confirmLabel="Remover da equipe"
        dismissLabel="Manter na equipe"
        onConfirm={() => {
          if (deactivating) void setActive(deactivating, false)
          setDeactivating(null)
        }}
      />
    </PanelPage>
  )
}
