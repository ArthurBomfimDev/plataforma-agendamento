import { ErrorScreen, LoadingScreen } from '@components/screen-state'
import { errorMessage, isNotFound } from '@lib/api/errors'
import { keyFromDay, timeIn, todayIn } from '@lib/api/time'
import { useAvailabilityCalendars, useBusiness, useDaySlots, useServices } from '@lib/api/queries'
import { useNavigate, useParams } from 'react-router'

import { BusinessDetailScreen } from '@features/business-detail'
import { NotFoundScreen } from '@features/not-found'
import { addDays } from 'date-fns'
import { chooseProfessionalPath } from './consts'
import { toBusinessDetail } from './adapters'

/** Quantos horários o card "Agendar agora" do desktop mostra, e em quantos dias procura. */
const NEXT_SLOTS_SHOWN = 3
const NEXT_SLOTS_LOOKAHEAD_DAYS = 14

export const BusinessDetailRoute = () => {
  const { businessId = '' } = useParams()
  const navigate = useNavigate()

  const business = useBusiness(businessId)
  const services = useServices(businessId)

  // "Próximos horários livres" do desktop: o horário depende do serviço, então usa o primeiro
  // serviço e o primeiro profissional dele — é uma vitrine, a escolha de verdade vem depois.
  const timeZone = business.data?.timeZone
  const firstService = services.data?.[0]
  const firstProfessional = firstService?.professionals[0]?.professionalId
  const target = {
    businessId,
    serviceId: firstService?.id ?? '',
    professionalIds: timeZone && firstProfessional ? [firstProfessional] : [],
  }
  const today = timeZone ? todayIn(timeZone) : new Date()
  const [calendar] = useAvailabilityCalendars(
    target,
    keyFromDay(today),
    keyFromDay(addDays(today, NEXT_SLOTS_LOOKAHEAD_DAYS - 1)),
  )
  const firstOpenDay = calendar?.data?.days.find(({ slotCount }) => slotCount > 0)?.date ?? null
  const [day] = useDaySlots(target, firstOpenDay)
  const nextFreeSlots =
    timeZone && day?.data
      ? day.data.slots.slice(0, NEXT_SLOTS_SHOWN).map((instant) => timeIn(instant, timeZone))
      : []

  const failed = business.isError ? business.error : services.isError ? services.error : null
  if (failed) {
    if (isNotFound(failed)) return <NotFoundScreen />
    return (
      <ErrorScreen
        message={errorMessage(failed)}
        onRetry={() => {
          void business.refetch()
          void services.refetch()
        }}
      />
    )
  }

  if (!business.data || !services.data) return <LoadingScreen />

  return (
    <BusinessDetailScreen
      business={toBusinessDetail(business.data, services.data)}
      nextFreeSlots={nextFreeSlots}
      onBookService={(serviceId) => navigate(chooseProfessionalPath(businessId, serviceId))}
    />
  )
}
