import type {
  InviteDraft,
  InvitesData,
  NewTeamMemberDraft,
  TeamData,
  TeamMember,
  TeamMemberDraft,
} from './screen/types'
import {
  useInvitationMutation,
  usePanelInvitations,
  usePanelSeats,
} from '@api/services/invitation/hooks'
import { invitationService } from '@api/services/invitation'
import { toPendingInvite } from '../manage-adapters'
import { professionalChanges, toTeamMember } from '../manage-adapters'
import { usePanelMutation, usePanelServices, usePanelTeam } from '@api/services/panel/hooks'

import { ROUTES } from '@router/paths'
import { TeamScreen } from './screen'
import { errorMessage } from '@api/base'
import { managementService } from '@api/services/management'
import { useProfessionalPhoto } from '@api/services/management/hooks'
import { notify } from '@components/toaster/notify'
import { useNavigate } from 'react-router'
import { usePanelContext } from '@layouts/panel-layout/context'

/**
 * Painel — Profissionais (Onda 7D). Salvar grava o perfil e depois liga e desliga os serviços (a API
 * tem uma rota por vínculo; habilitar exige profissional ativo, então desativar não mexe nos serviços).
 */
export const PanelTeamRoute = () => {
  const { context, business, schedules, today } = usePanelContext()
  const navigate = useNavigate()
  const team = usePanelTeam(context.businessId)
  const services = usePanelServices(context.businessId, true)
  const photo = useProfessionalPhoto(context.businessId)

  const create = usePanelMutation(context.businessId, (draft: NewTeamMemberDraft) =>
    managementService.createProfessional(draft),
  )
  const save = usePanelMutation(
    context.businessId,
    async ({ member, draft }: { member: TeamMember; draft: TeamMemberDraft }) => {
      const saved = await managementService.updateProfessional(member.id, {
        displayName: draft.displayName,
        specialty: draft.specialty,
        bio: draft.bio,
        isActive: draft.isActive,
        registration: draft.registration,
        authorizationDeclared: draft.authorizationDeclared,
      })
      if (draft.isActive) {
        const changes = professionalChanges(member.serviceIds, draft.serviceIds)
        await Promise.all([
          ...changes.enable.map((serviceId) =>
            managementService.enableProfessional(serviceId, member.id),
          ),
          ...changes.disable.map((serviceId) =>
            managementService.disableProfessional(serviceId, member.id),
          ),
        ])
      }
      return saved
    },
  )

  const pending = usePanelInvitations(context.businessId, true)
  const seats = usePanelSeats(context.businessId, true)
  const invite = useInvitationMutation(context.businessId, (draft: InviteDraft) =>
    invitationService.invite(draft),
  )
  const resend = useInvitationMutation(context.businessId, (id: string) =>
    invitationService.resend(id),
  )
  const revoke = useInvitationMutation(context.businessId, (id: string) =>
    invitationService.revoke(id),
  )
  const attempt = async (task: () => Promise<unknown>) => {
    try {
      await task()
      return null
    } catch (error) {
      return errorMessage(error)
    }
  }

  const invites: InvitesData = pending.isError
    ? {
        status: 'error',
        message: errorMessage(pending.error),
        onRetry: () => void pending.refetch(),
      }
    : pending.data
      ? {
          status: 'ready',
          invites: pending.data.map(toPendingInvite),
          // As vagas são um complemento: se não chegarem, a lista de convites continua útil.
          seats: seats.data ?? null,
        }
      : { status: 'loading' }

  const failed = team.isError ? team : services.isError ? services : null
  const data: TeamData = failed
    ? {
        status: 'error',
        message: errorMessage(failed.error),
        onRetry: () => {
          void team.refetch()
          void services.refetch()
        },
      }
    : team.data && services.data
      ? {
          status: 'ready',
          members: team.data.map((professional) =>
            toTeamMember(professional, services.data, schedules.get(professional.id), today),
          ),
          services: services.data.map(({ id, name, isActive }) => ({ id, name, isActive })),
        }
      : { status: 'loading' }

  return (
    <TeamScreen
      data={data}
      businessName={business.name}
      showRegistration={business.category === 'Saude'}
      invites={invites}
      photo={{ onUpload: photo.upload, onRemove: photo.remove }}
      onInvite={(draft) =>
        attempt(async () => {
          const sent = await invite.mutateAsync(draft)
          notify.success(`Convite enviado para ${sent.email}.`)
        })
      }
      onResendInvite={(id) => attempt(() => resend.mutateAsync(id))}
      onRevokeInvite={(id) => attempt(() => revoke.mutateAsync(id))}
      onOpenSchedules={() => navigate(ROUTES.panelSchedules)}
      onCreate={async (draft) => {
        try {
          const created = await create.mutateAsync(draft)
          notify.success(`Perfil de ${created.displayName} criado. Ligue os serviços em "Editar".`)
          return null
        } catch (error) {
          return errorMessage(error)
        }
      }}
      onSave={async (member, draft) => {
        try {
          const saved = await save.mutateAsync({ member, draft })
          notify.success(
            member.isActive === saved.isActive
              ? `${saved.displayName} atualizado.`
              : saved.isActive
                ? `${saved.displayName} ativado.`
                : `${saved.displayName} desativado. Saiu da agenda e da vitrine.`,
          )
          return null
        } catch (error) {
          return errorMessage(error)
        }
      }}
    />
  )
}
