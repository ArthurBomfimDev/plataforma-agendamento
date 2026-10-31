import type { NewTeamMemberDraft, TeamData, TeamMember, TeamMemberDraft } from './screen/types'
import { professionalChanges, toTeamMember } from '../manage-adapters'
import { usePanelMutation, usePanelServices, usePanelTeam } from '@api/services/panel/hooks'

import { TeamScreen } from './screen'
import { errorMessage } from '@api/base'
import { managementService } from '@api/services/management'
import { notify } from '@components/toaster/notify'
import { usePanelContext } from '@layouts/panel-layout/context'

/**
 * Painel — Profissionais (Onda 7D). Salvar grava o perfil e depois liga e desliga os serviços (a API
 * tem uma rota por vínculo; habilitar exige profissional ativo, então desativar não mexe nos serviços).
 */
export const PanelTeamRoute = () => {
  const { context, business } = usePanelContext()
  const team = usePanelTeam(context.businessId)
  const services = usePanelServices(context.businessId, true)

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
        showFullProfile: draft.showFullProfile,
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
          notify.success(`${created.displayName} cadastrado. Ligue os serviços em "Editar".`)
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
