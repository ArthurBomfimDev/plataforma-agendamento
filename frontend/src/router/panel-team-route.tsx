import type {
  NewTeamMemberDraft,
  TeamData,
  TeamMember,
  TeamMemberDraft,
} from '@features/panel-team/types'
import { professionalChanges, toTeamMember } from './manage-adapters'
import { usePanelMutation, usePanelServices, usePanelTeam } from '@lib/api/queries'

import { TeamScreen } from '@features/panel-team'
import { errorMessage } from '@lib/api/errors'
import { manageApi } from '@lib/api/endpoints'
import { toast } from '@lib/toast'
import { usePanelContext } from './panel-context'

/**
 * Painel — Profissionais (Onda 7D). Salvar grava o perfil e depois liga e desliga os serviços (a API
 * tem uma rota por vínculo; habilitar exige profissional ativo, então desativar não mexe nos serviços).
 */
export const PanelTeamRoute = () => {
  const { context, business } = usePanelContext()
  const team = usePanelTeam(context.businessId)
  const services = usePanelServices(context.businessId, true)

  const create = usePanelMutation(context.businessId, (draft: NewTeamMemberDraft) =>
    manageApi.createProfessional(draft),
  )
  const save = usePanelMutation(
    context.businessId,
    async ({ member, draft }: { member: TeamMember; draft: TeamMemberDraft }) => {
      const saved = await manageApi.updateProfessional(member.id, {
        displayName: draft.displayName,
        specialty: draft.specialty,
        bio: draft.bio,
        isActive: draft.isActive,
        showFullProfile: draft.showFullProfile,
      })
      if (draft.isActive) {
        const changes = professionalChanges(member.serviceIds, draft.serviceIds)
        await Promise.all([
          ...changes.enable.map((serviceId) => manageApi.enableProfessional(serviceId, member.id)),
          ...changes.disable.map((serviceId) =>
            manageApi.disableProfessional(serviceId, member.id),
          ),
        ])
      }
      return saved
    },
  )

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
          members: team.data.map((professional) => toTeamMember(professional, services.data)),
          services: services.data.map(({ id, name, isActive }) => ({ id, name, isActive })),
        }
      : { status: 'loading' }

  return (
    <TeamScreen
      data={data}
      businessName={business.name}
      onCreate={async (draft) => {
        try {
          const created = await create.mutateAsync(draft)
          toast.success(`${created.displayName} cadastrado. Ligue os serviços em "Editar".`)
          return null
        } catch (error) {
          return errorMessage(error)
        }
      }}
      onSave={async (member, draft) => {
        try {
          const saved = await save.mutateAsync({ member, draft })
          toast.success(
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
