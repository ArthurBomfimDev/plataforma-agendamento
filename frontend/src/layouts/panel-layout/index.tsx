import {
  type ChooseContextState,
  OWNER_ONLY_SECTIONS,
  PANEL_PATHS,
  ROUTES,
  canManageBusiness,
  panelSectionOf,
  signInPath,
} from '@router/paths'
import { ErrorScreen, LoadingScreen, LoadingState } from '@components/screen-state'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router'
import type { PanelBusiness, PanelContext } from './context'
import { useBusinessContext } from '@api/services/auth/hooks'
import {
  useCounterBooking,
  usePanelAction,
  usePanelBusiness,
  usePanelPending,
  usePanelProfessionals,
  usePanelServices,
  usePanelWorkScheduleMap,
} from '@api/services/panel/hooks'

import { AccountMenu } from '@components/account-menu'
import type { BusinessContext } from '@store/session/types'
import { Button } from '@components/button'
import { COUNTER_BOOKING_LABEL, dayLabel } from '@pages/panel/agenda/screen/consts'
import { CounterBookingDialog } from '@components/counter-booking-dialog'
import type { CounterBookingSlot } from '@pages/panel/agenda/screen/types'
import { DESKTOP_QUERY } from '@hooks/use-media-query/consts'
import type { PanelBottomItem } from '@components/bottom-navigation/types'
import { BottomNavigation } from '@components/bottom-navigation'
import { PANEL_NAVIGATION_ITEMS } from '@components/bottom-navigation/consts'
import { PageTransition } from '@components/page-transition'
import { PendingBadge } from '@components/pending-badge'
import type { PanelSection } from '@components/panel-sidebar/types'
import { PanelSidebar } from '@components/panel-sidebar'
import type { PendingRequestsData } from '@pages/panel/requests/screen/types'
import { dateKeyIn, instantIn } from '@utils/time-zone'
import { errorMessage } from '@api/base'
import { prefetchPanelPages } from '@router/panel-pages'
import { panelAccess } from './guard'
import { performPanelAction } from './actions'
import { toPendingRequest } from '@pages/panel/adapters'
import { notify } from '@components/toaster/notify'
import { useAccountMenu } from '@hooks/use-account-menu'
import { useMediaQuery } from '@hooks/use-media-query'
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useOptimistic,
  useState,
  useTransition,
} from 'react'
import { useSessionStore } from '@store/session'

const BOTTOM_ITEMS: ReadonlyArray<PanelBottomItem> = ['agenda', 'requests']

// Referências fixas para o que ainda não chegou: um `[]` novo a cada render desfaria o `useMemo` do contexto.
const NO_PROFESSIONALS: PanelContext['professionals'] = []
const NO_PENDING: PanelContext['pendingItems'] = []
const NO_SECTIONS: ReadonlyArray<PanelSection> = []

/**
 * Moldura do painel do estabelecimento: navegação lateral no desktop, inferior no celular, e a
 * tela da seção no meio. Fica montada ao trocar de seção; só o `<Outlet />` muda.
 *
 * Exige sessão em contexto de estabelecimento (`panelAccess`). Os pedidos pendentes moram aqui
 * porque o contador das duas navegações depende deles; a marcação de balcão também, porque o botão
 * do celular fica na navegação inferior.
 *
 * As seções de gestão (Onda 7D) são só do dono: o profissional não as vê no menu e, se digitar o
 * endereço, `RequireOwner` o devolve para a agenda.
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
  const professionalList = professionals.data ?? NO_PROFESSIONALS
  const professionalIds = useMemo(() => professionalList.map(({ id }) => id), [professionalList])
  const schedules = usePanelWorkScheduleMap(businessId, professionalIds)
  const pending = usePanelPending(businessId)
  const services = usePanelServices(businessId, counter.open)
  const action = usePanelAction(businessId)
  const counterBooking = useCounterBooking(businessId)

  const { refetch: refetchPending } = pending
  const pendingItems = pending.data?.items ?? NO_PENDING
  const pendingData = useMemo<PendingRequestsData>(() => {
    if (pending.isError) {
      return {
        status: 'error',
        message: errorMessage(pending.error),
        onRetry: () => void refetchPending(),
      }
    }
    if (!pending.data) return { status: 'loading' }
    const nameOf = (id: string) =>
      professionalList.find((professional) => professional.id === id)?.displayName ?? null
    return {
      status: 'ready',
      requests: pendingItems.map((appointment) =>
        toPendingRequest(appointment, {
          timeZone: business.timeZone,
          professionalName: nameOf,
          schedules,
        }),
      ),
    }
  }, [
    pending.data,
    pending.isError,
    pending.error,
    refetchPending,
    pendingItems,
    professionalList,
    schedules,
    business.timeZone,
  ])
  const pendingCount = pending.data?.totalCount ?? 0

  const hidden = canManageBusiness(context.role) ? NO_SECTIONS : OWNER_ONLY_SECTIONS
  // `section` otimista: o item do menu acende no toque, antes de a tela nova (e seu chunk) chegar.
  const [section, setOptimisticSection] = useOptimistic(panelSectionOf(pathname))
  const [, startTransition] = useTransition()
  const activeSection = section === 'more' ? null : section
  const activeItem = BOTTOM_ITEMS.find((item) => item === section) ?? 'more'

  // Telas do painel baixam em segundo plano, para a primeira visita a cada seção não esperar a rede.
  useEffect(() => prefetchPanelPages(), [])

  const navigateTo = useCallback(
    (target: PanelSection | PanelBottomItem) => {
      if (target !== 'more' && hidden.includes(target)) {
        notify.info('Só o dono do estabelecimento altera esta seção.')
        return
      }
      // Em transição, a tela atual fica até a nova estar pronta: sem trocar o conteúdo por um "Carregando…".
      startTransition(() => {
        setOptimisticSection(target)
        navigate(PANEL_PATHS[target])
      })
    },
    [hidden, navigate, setOptimisticSection],
  )

  const openCounterBooking = useCallback((slot?: CounterBookingSlot) => {
    setCounterError(undefined)
    setCounter({ open: true, slot })
  }, [])

  const { mutateAsync: mutateAction } = action
  const runAction = useCallback<PanelContext['runAction']>(
    (kind, appointmentId) =>
      performPanelAction(() => mutateAction({ action: kind, appointmentId })),
    [mutateAction],
  )

  // Estável entre renders: abrir a gaveta de balcão ou digitar nela não refaz a tela aberta.
  const outlet = useMemo<PanelContext>(
    () => ({
      context,
      business,
      today,
      date,
      setDate,
      professionals: professionalList,
      schedules,
      pending: pendingData,
      pendingItems,
      pendingCount,
      navigateTo,
      openCounterBooking,
      runAction,
    }),
    [
      context,
      business,
      today,
      date,
      professionalList,
      schedules,
      pendingData,
      pendingItems,
      pendingCount,
      navigateTo,
      openCounterBooking,
      runAction,
    ],
  )

  const counterDate = counter.slot?.date ?? date

  return (
    <div className="min-h-dvh bg-(--bg-page) lg:flex">
      <PanelSidebar
        businessName={business.name}
        logo={business.logo}
        category={business.category}
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
        <Suspense
          fallback={
            <div className="p-(--space-16) lg:p-(--space-24)">
              <LoadingState />
            </div>
          }
        >
          <PageTransition transitionKey={pathname}>
            <Outlet context={outlet} />
          </PageTransition>
        </Suspense>
      </div>

      <BottomNavigation
        items={PANEL_NAVIGATION_ITEMS}
        label="Painel do estabelecimento"
        variant="panel"
        activeItem={activeItem}
        badges={{
          requests: pendingCount > 0 && (
            <PendingBadge
              count={pendingCount}
              className="border border-(--status-pending-fg) px-(--space-4)"
            />
          ),
        }}
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
                notify.success(`Marcado: ${values.walkInName}, às ${values.time}.`)
              },
              onError: (error) => setCounterError(errorMessage(error)),
            },
          )
        }}
      />
    </div>
  )
}
