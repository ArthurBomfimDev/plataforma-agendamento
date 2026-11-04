import { errorMessage, isNotFound } from '@api/base'
import { keyFromDay, timeIn, todayIn } from '@utils/time-zone'
import { useDaySlots } from '@api/services/availability/hooks'
import { useNavigate, useParams } from 'react-router'
import { addDays } from 'date-fns'
import {
  useProfessionalPage,
  useRequestProfessionalRemoval,
} from '@api/services/professional/hooks'

import { NotFoundScreen } from '@pages/not-found'
import { ProfessionalPageScreen } from './screen'
import type { ProfessionalPageData } from './screen/types'
import { availabilityPath, businessPath } from '@router/paths'

/**
 * `#/profissional/:professionalId` — página pública do profissional (ADR-031). Perfil inativo, estabelecimento fora da
 * vitrine ou id que não existe respondem 404: mostra a tela de "não encontrado". Os horários de hoje e amanhã vêm do
 * primeiro serviço dele; a escolha de verdade acontece no fluxo de agendamento.
 */
export const ProfessionalPageRoute = () => {
  const { professionalId = '' } = useParams()
  const navigate = useNavigate()
  const page = useProfessionalPage(professionalId)
  const removal = useRequestProfessionalRemoval()

  const professional = page.data
  const timeZone = professional?.business.timeZone
  const firstService = professional?.services[0]
  const target = {
    businessId: professional?.business.id ?? '',
    serviceId: firstService?.id ?? '',
    professionalIds: professional && firstService ? [professional.id] : [],
  }
  const today = timeZone ? todayIn(timeZone) : new Date()
  const todayKey = timeZone && firstService ? keyFromDay(today) : null
  const tomorrowKey = timeZone && firstService ? keyFromDay(addDays(today, 1)) : null
  const [todaySlots] = useDaySlots(target, todayKey)
  const [tomorrowSlots] = useDaySlots(target, tomorrowKey)

  if (page.isError) {
    return isNotFound(page.error) ? (
      <NotFoundScreen />
    ) : (
      <ProfessionalPageScreen
        data={{
          status: 'error',
          message: errorMessage(page.error),
          onRetry: () => void page.refetch(),
        }}
      />
    )
  }

  const data: ProfessionalPageData = professional
    ? {
        status: 'ready',
        professional: {
          id: professional.id,
          name: professional.displayName,
          specialty: professional.specialty,
          bio: professional.bio,
          registration: professional.registration,
          photo: professional.photo,
          business: {
            id: professional.business.id,
            name: professional.business.name,
            address: professional.business.addressLine,
            category: professional.business.category,
          },
          services: professional.services,
          nextSlots: [
            {
              label: 'Hoje',
              times: (todaySlots?.data?.slots ?? [])
                .slice(0, 4)
                .map((slot) => timeIn(slot, professional.business.timeZone)),
            },
            {
              label: 'Amanhã',
              times: (tomorrowSlots?.data?.slots ?? [])
                .slice(0, 4)
                .map((slot) => timeIn(slot, professional.business.timeZone)),
            },
          ],
        },
      }
    : { status: 'loading' }

  return (
    <ProfessionalPageScreen
      data={data}
      onBook={(serviceId) => {
        const target = serviceId ?? professional?.services[0]?.id
        if (professional && target)
          navigate(availabilityPath(professional.business.id, target, professional.id))
      }}
      onOpenBusiness={(businessId) => navigate(businessPath(businessId))}
      onRequestRemoval={async (reason, contact) => {
        try {
          await removal.mutateAsync({ professionalId, reason, contact })
          return null
        } catch (error) {
          return errorMessage(error)
        }
      }}
    />
  )
}
