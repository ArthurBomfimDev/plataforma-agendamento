import {
  SEARCH_PARAMS,
  bookingReviewPath,
  businessPath,
  chooseProfessionalPath,
} from '@router/paths'
import { addDays, isBefore } from 'date-fns'
import { dayFromKey, keyFromDay, timeIn, todayIn } from '@utils/time-zone'
import { useAvailabilityCalendars, useDaySlots } from '@api/services/availability/hooks'
import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'

import { AvailabilityScreen } from './screen'
import type { CalendarDayInfo } from '@components/availability-calendar/types'
import { ErrorScreen } from '@components/screen-state'
import { LoadingScreen } from '@components/screen-state'
import { NotFoundScreen } from '@pages/not-found'
import { contextFallback } from '../context-fallback'
import { errorMessage } from '@api/base'
import { groupSlots } from '@pages/customer/adapters'
import { useBookingContext } from '../use-booking-context'

/**
 * Janela do calendário: 60 dias a partir de hoje, o horizonte padrão de agendamento do
 * estabelecimento. O endpoint de calendário aceita até 62 dias por chamada.
 * TODO: usar o `BookingHorizonDays` do estabelecimento quando ele vier na vitrine pública.
 */
const CALENDAR_DAYS = 60
const MONTHS_AHEAD = 2

type DaySummary = { works: boolean; slotCount: number; holiday: string | null }

export const AvailabilityRoute = () => {
  const { businessId = '', serviceId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const professionalId = searchParams.get(SEARCH_PARAMS.professional)
  const context = useBookingContext(businessId, serviceId)
  const ready = context.status === 'ready' ? context : null

  // "Sem preferência" consulta todos os que executam o serviço e soma os horários.
  const professionalIds = ready
    ? professionalId
      ? ready.professionals.some(({ id }) => id === professionalId)
        ? [professionalId]
        : []
      : ready.professionals.map(({ id }) => id)
    : []
  const target = { businessId, serviceId, professionalIds }

  const timeZone = ready?.business.timeZone
  const today = timeZone ? todayIn(timeZone) : new Date()
  const from = keyFromDay(today)
  const to = keyFromDay(addDays(today, CALENDAR_DAYS - 1))

  const calendars = useAvailabilityCalendars(target, from, to)
  const calendarsReady = calendars.length > 0 && calendars.every((query) => query.data)
  const calendarError = calendars.find((query) => query.isError)?.error

  const days = new Map<string, DaySummary>()
  for (const query of calendars) {
    for (const day of query.data?.days ?? []) {
      const current = days.get(day.date)
      days.set(day.date, {
        works: (current?.works ?? false) || day.works,
        slotCount: (current?.slotCount ?? 0) + day.slotCount,
        holiday: day.holiday,
      })
    }
  }

  const firstOpenKey = [...days].find(([, day]) => day.slotCount > 0)?.[0]
  const firstOpenDay = firstOpenKey ? dayFromKey(firstOpenKey) : undefined

  const [chosenDate, setChosenDate] = useState<Date | undefined>(undefined)
  const selectedDate = chosenDate ?? firstOpenDay
  const selectedKey = selectedDate ? keyFromDay(selectedDate) : null

  const daySlots = useDaySlots(target, selectedKey)
  const slotsReady = daySlots.length > 0 && daySlots.every((query) => query.data)

  // Instante → profissional. Com "Sem preferência", o primeiro que oferece o horário.
  const owners = new Map<string, string>()
  for (const query of daySlots) {
    for (const instant of query.data?.slots ?? []) {
      if (!owners.has(instant)) owners.set(instant, query.data!.professionalId)
    }
  }
  const slotOwners = new Map([...owners].sort(([a], [b]) => a.localeCompare(b)))

  if (!ready) return contextFallback(context)

  const { business, service, professionals } = ready
  const professional = professionals.find(({ id }) => id === professionalId)

  // Profissional da URL que não executa o serviço, ou serviço sem ninguém habilitado.
  if ((professionalId && !professional) || professionalIds.length === 0) return <NotFoundScreen />

  if (calendarError) {
    return (
      <ErrorScreen
        message={errorMessage(calendarError)}
        onRetry={() => calendars.forEach((query) => void query.refetch())}
      />
    )
  }
  if (!calendarsReady) return <LoadingScreen label="Buscando horários…" />

  const getDayInfo = (date: Date): CalendarDayInfo => {
    const day = days.get(keyFromDay(date))
    const holiday = day?.holiday ? { holiday: { name: day.holiday } } : {}
    if (isBefore(date, today)) return { status: 'past', ...holiday }
    // Fora da janela consultada, ou dia sem jornada: fechado.
    if (!day || !day.works) return { status: 'closed', ...holiday }
    if (day.slotCount === 0) return { status: 'no-slots', ...holiday }
    return { status: 'available', ...holiday }
  }

  return (
    <AvailabilityScreen
      businessName={business.name}
      service={service}
      professionalName={professional?.name ?? null}
      today={today}
      monthsAhead={MONTHS_AHEAD}
      confirmationHours={business.pendingExpirationHours}
      getDayInfo={getDayInfo}
      selectedDate={selectedDate}
      onSelectDate={setChosenDate}
      slots={slotsReady ? groupSlots([...slotOwners.keys()], business.timeZone) : null}
      onBack={() => navigate(chooseProfessionalPath(businessId, serviceId))}
      onOpenBusiness={() => navigate(businessPath(businessId))}
      onContinue={(_date, time) => {
        const chosen = [...slotOwners].find(
          ([instant]) => timeIn(instant, business.timeZone) === time,
        )
        if (!chosen) return
        const [startsAt, owner] = chosen
        navigate(bookingReviewPath(businessId, serviceId, { professionalId: owner, startsAt }))
      }}
    />
  )
}
