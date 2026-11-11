import { AttendantProfileRoute } from './attendant'
import { ProfileScreen } from './screen'
import { ROUTES } from '@router/paths'
import { useLeaveBusiness } from '@api/services/professional/hooks'
import { useNavigate } from 'react-router'
import type { ProfileData } from './screen/types'
import { errorMessage } from '@api/base'
import { managementService } from '@api/services/management'
import { optional } from '../team/screen/consts'
import { useMyProfessionalProfile } from '@api/services/management/hooks'
import { usePanelContext } from '@layouts/panel-layout/context'
import { usePanelMutation } from '@api/services/panel/hooks'

/**
 * Painel — Meu perfil (ADR-031): o profissional com conta edita a própria especialidade, bio, registro e foto.
 * O servidor confere que o perfil é o da conta (403 para quem não tem perfil ligado).
 */
export const PanelProfileRoute = () =>
  usePanelContext().context.role === 'Attendant' ? (
    <AttendantProfileRoute />
  ) : (
    <ProfessionalProfileRoute />
  )

const ProfessionalProfileRoute = () => {
  const { context, business } = usePanelContext()
  const mine = useMyProfessionalProfile(context.businessId, true)
  const leave = useLeaveBusiness()
  const navigate = useNavigate()

  const save = usePanelMutation(
    context.businessId,
    (values: { specialty: string; bio: string; registration: string }) =>
      managementService.updateMyProfile({
        specialty: optional(values.specialty),
        bio: optional(values.bio),
        registration: optional(values.registration),
      }),
  )

  const data: ProfileData = mine.isError
    ? { status: 'error', message: errorMessage(mine.error), onRetry: () => void mine.refetch() }
    : mine.data
      ? {
          status: 'ready',
          profile: {
            id: mine.data.id,
            displayName: mine.data.displayName,
            specialty: mine.data.specialty,
            bio: mine.data.bio,
            registration: mine.data.registration,
            photo: mine.data.photo,
          },
        }
      : { status: 'loading' }

  return (
    <ProfileScreen
      data={data}
      businessName={business.name}
      showRegistration={business.category === 'Saude'}
      onSave={async (values) => {
        try {
          await save.mutateAsync(values)
          return null
        } catch (error) {
          return errorMessage(error)
        }
      }}
      onUploadPhoto={async (file, onProgress) => {
        if (!mine.data) return null
        const updated = await managementService.uploadProfessionalPhoto(
          mine.data.id,
          file,
          onProgress,
        )
        await mine.refetch()
        return updated.photo
      }}
      onLeave={async () => {
        try {
          await leave.mutateAsync()
          navigate(ROUTES.home, { replace: true })
          return null
        } catch (error) {
          return errorMessage(error)
        }
      }}
      onRemovePhoto={async () => {
        if (!mine.data) return
        await managementService.removeProfessionalPhoto(mine.data.id)
        await mine.refetch()
      }}
    />
  )
}
