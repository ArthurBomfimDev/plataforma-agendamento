import {
  type ChooseContextState,
  OWNER_ONLY_SECTIONS,
  PANEL_PATHS,
  ROUTES,
  signInPath,
} from './consts'
import { ErrorScreen, LoadingScreen } from '@components/screen-state'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router'
import type { PanelBusiness, PanelContext } from './panel-context'
import {
  useBusinessContext,
  useCounterBooking,
  usePanelAction,
  usePanelBusiness,
  usePanelPending,
  usePanelProfessionals,
  usePanelServices,
  usePanelWorkSchedules,
} from '@lib/api/queries'

import { AccountMenu } from '@components/account-menu'
import type { BusinessContext } from '@lib/zustand/session/types'
import { Button } from '@components/button'
import { COUNTER_BOOKING_LABEL, dayLabel } from '@features/business-agenda/consts'
import { CounterBookingDialog } from '@components/counter-booking-dialog'
import type { CounterBookingSlot } from '@features/business-agenda/types'
import { DESKTOP_QUERY } from '@hooks/use-media-query/consts'
import type { PanelBottomItem } from '@components/panel-bottom-navigation/types'
import { PanelBottomNavigation } from '@components/panel-bottom-navigation'
import type { PanelSection } from '@components/panel-sidebar/types'
import { PanelSidebar } from '@components/panel-sidebar'
import type { PendingRequestsData } from '@features/pending-requests/types'
import { dateKeyIn, instantIn } from '@lib/api/time'
import { errorMessage } from '@lib/api/errors'
import { panelAccess } from './panel-guard'
import { performPanelAction } from './panel-actions'
import { toPendingRequest } from './panel-adapters'
import { toast } from '@lib/toast'
import { useAccountMenu } from './use-account-menu'
import { useMediaQuery } from '@hooks/use-media-query'
import { useState } from 'react'
import { useSessionStore } from '@lib/zustand/session'

const BOTTOM_ITEMS: ReadonlyArray<PanelBottomItem> = ['agenda', 'requests', 'reports']

/**
 * Moldura do painel do estabelecimento: navegação lateral no desktop, inferior no celular, e a
 * tela da seção no meio. Fica montada ao trocar de seção; só o `<Outlet />` muda.
 *
 * Exige sessão em contexto de estabelecimento (`panelAccess`). Os pedidos pendentes moram aqui
 * porque o contador das duas navegações depende deles; a marcação de balcão também, porque o botão
 * do celular fica na navegação inferior.
 *
 * TODO: as outras seções (Serviços, Profissionais, Relatórios…) ainda não têm tela e avisam.
 */
export const PanelLayout = () => {
  const signedIn = useSessionStore((state) => state.session !== null)
  const signedOut = useSessionStore((state) => state.signedOut)
  const context = useBusinessContext()
  const { pathname } = useLocation()

  switch (panelAccess(signedIn, context, signedOut)) {
    case 'home':
      return <Navigate to={ROUTES.home} replace />
    case 'sign-in':
      return <Navigate to={signInPath(pathname)} replace />
    case 'choose-context': {
      const state: ChooseContextState = { reason: 'panel' }
      return <Navigate to={ROUTES.chooseContext} replace state={state} />
    }
    default:
      // A chave zera o estado (dia, diálogos) ao trocar de estabelecimento.
      return <PanelBusinessGate key={context!.businessId} context={context!} />
  }
}

/** Espera o estabelecimento (nome, fuso, prazo) antes de montar o painel. */
const PanelBusinessGate = ({ context }: { context: BusinessContext }) => {
  const business = usePanelBusiness(context)

  if (business.isPending) return <LoadingScreen label="Abrindo o painel…" />
  if (business.isError) {
    return (
      <ErrorScreen message={errorMessage(business.error)} onRetry={() => void business.refetch()} />
    )
  }
  return <PanelShell context={context} business={business.data} />
}

const PanelShell = ({
  context,
  business,
}: {
  context: BusinessContext
  business: PanelBusiness
}) => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const accountMenu = useAccountMenu()
  const { businessId } = context

  const today = dateKeyIn(new Date(), business.timeZone)
  const [date, setDate] = useState(today)
  const [counter, setCounter] = useState<{ open: boolean; slot?: CounterBookingSlot }>({
    open: false,
  })
  const [counterError, setCounterError] = useState<string>()

  const professionals = usePanelProfessionals(businessId)
  const professionalIds = (professionals.data ?? []).map(({ id }) => id)
  const scheduleQueries = usePanelWorkSchedules(businessId, professionalIds)
  const schedules = new Map(
    professionalIds.flatMap((id, index) => {
      const data = scheduleQueries[index]?.data
      return data ? [[id, data] as const] : []
    }),
  )
  const pending = usePanelPending(businessId)
  const services = usePanelServices(businessId, counter.open)
  const action = usePanelAction(businessId)
  const counterBooking = useCounterBooking(businessId)

  const nameOf = (id: string) =>
    professionals.data?.find((professional) => professional.id === id)?.displayName ?? null

  const pendingItems = pending.data?.items ?? []
  const pendingData: PendingRequestsData = pending.isError
    ? {
        status: 'error',
        message: errorMessage(pending.error),
        onRetry: () => void pending.refetch(),
      }
    : pending.data
      ? {
          status: 'ready',
          requests: pendingItems.map((appointment) =>
            toPendingRequest(appointment, {
              timeZone: business.timeZone,
              professionalName: nameOf,
              schedules,
            }),
          ),
        }
      : { status: 'loading' }
  const pendingCount = pending.data?.totalCount ?? 0

  const hidden = context.role === 'Owner' ? [] : OWNER_ONLY_SECTIONS
  const activeSection =
    (Object.keys(PANEL_PATHS) as PanelSection[]).find(
      (section) => PANEL_PATHS[section] === pathname,
    ) ?? 'agenda'
  const activeItem = BOTTOM_ITEMS.find((item) => item === activeSection) ?? 'more'

  const navigateTo = (section: PanelSection | PanelBottomItem) => {
    const path = PANEL_PATHS[section]
    if (path) navigate(path)
    else toast.info('Esta seção do painel ainda não está disponível.')
  }

  const openCounterBooking = (slot?: CounterBookingSlot) => {
    setCounterError(undefined)
    setCounter({ open: true, slot })
  }

  const runAction: PanelContext['runAction'] = (kind, appointmentId) =>
    performPanelAction(() => action.mutateAsync({ action: kind, appointmentId }))

  const outlet: PanelContext = {
    context,
    business,
    today,
    date,
    setDate,
    professionals: professionals.data ?? [],
    schedules,
    pending: pendingData,
    pendingItems,
    pendingCount,
    navigateTo,
    openCounterBooking,
    runAction,
  }

  const counterDate = counter.slot?.date ?? date

  return (
    <div className="min-h-dvh bg-(--bg-page) lg:flex">
      <PanelSidebar
        businessName={business.name}
        activeSection={activeSection}
        pendingRequests={pendingCount}
        onNavigate={navigateTo}
        hiddenSections={hidden}
        footer={
          accountMenu && (
            <AccountMenu {...accountMenu} side="top" align="start" className="w-full max-w-none" />
          )
        }
      />

      <div className="min-w-0 flex-1">
        <Outlet context={outlet} />
      </div>

      <PanelBottomNavigation
        activeItem={activeItem}
        pendingRequests={pendingCount}
        onNavigate={navigateTo}
        action={
          pathname === ROUTES.panel && (
            <Button size="lg" className="w-full" onClick={() => openCounterBooking()}>
              {COUNTER_BOOKING_LABEL}
            </Button>
          )
        }
      />

      <CounterBookingDialog
        open={counter.open}
        onOpenChange={(open) => !open && setCounter({ open: false })}
        side={isDesktop ? 'right' : 'bottom'}
        dayLabel={dayLabel(counterDate)}
        initial={counter.slot}
        professionals={(professionals.data ?? []).map(({ id, displayName }) => ({
          id,
          name: displayName,
        }))}
        services={(services.data ?? []).map((service) => ({
          id: service.id,
          name: service.name,
          durationMinutes: service.durationMinutes,
          professionalIds: service.professionals.map(({ professionalId }) => professionalId),
        }))}
        servicesLoading={services.isPending}
        submitting={counterBooking.isPending}
        error={counterError}
        onSubmit={(values) => {
          setCounterError(undefined)
          counterBooking.mutate(
            {
              serviceId: values.serviceId,
              professionalId: values.professionalId,
              startsAt: instantIn(counterDate, values.time, business.timeZone),
              walkInName: values.walkInName,
              walkInPhone: values.walkInPhone,
              notes: null,
            },
            {
              onSuccess: () => {
                setCounter({ open: false })
                toast.success(`Marcado: ${values.walkInName}, às ${values.time}.`)
              },
              onError: (error) => setCounterError(errorMessage(error)),
            },
          )
        }}
      />
    </div>
  )
}
