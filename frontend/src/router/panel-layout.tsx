import { Outlet, useLocation, useNavigate } from 'react-router'
import { PANEL_PATHS, ROUTES } from './consts'
import { type PanelContext, openCounterBooking } from './panel-context'

import { Button } from '@components/button'
import { COUNTER_BOOKING_LABEL } from '@features/business-agenda/consts'
import { MOCK_BUSINESS } from '@features/business-agenda/mock'
import type { PanelBottomItem } from '@components/panel-bottom-navigation/types'
import { PanelBottomNavigation } from '@components/panel-bottom-navigation'
import type { PanelSection } from '@components/panel-sidebar/types'
import { PanelSidebar } from '@components/panel-sidebar'
import { createMockPendingRequests } from '@features/pending-requests/mock'
import { toast } from '@lib/toast'
import { useState } from 'react'

const BOTTOM_ITEMS: ReadonlyArray<PanelBottomItem> = ['agenda', 'requests', 'reports']

/**
 * Moldura do painel do estabelecimento: navegação lateral no desktop, inferior no celular, e a
 * tela da seção no meio. Fica montada ao trocar de seção; só o `<Outlet />` muda.
 *
 * Os pedidos pendentes moram aqui porque o contador das duas navegações depende deles.
 *
 * TODO: as outras seções (Profissionais, Relatórios, "Mais"…) ainda não têm tela e por
 * enquanto avisam. O painel também ainda não exige login de Owner ou Professional: isso depende do
 * módulo Identity, que exige revisão humana.
 */
export const PanelLayout = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  // TODO: sem API, os pedidos vêm do mock da tela 10.
  const [requests, setRequests] = useState(() => createMockPendingRequests())

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

  const context: PanelContext = {
    requests,
    removeRequest: (requestId) =>
      setRequests((current) => current.filter(({ id }) => id !== requestId)),
    navigateTo,
  }

  return (
    <div className="min-h-dvh bg-(--bg-page) lg:flex">
      <PanelSidebar
        businessName={MOCK_BUSINESS.name}
        activeSection={activeSection}
        pendingRequests={requests.length}
        onNavigate={navigateTo}
      />

      <div className="min-w-0 flex-1">
        <Outlet context={context} />
      </div>

      <PanelBottomNavigation
        activeItem={activeItem}
        pendingRequests={requests.length}
        onNavigate={navigateTo}
        action={
          pathname === ROUTES.panel && (
            <Button size="lg" className="w-full" onClick={openCounterBooking}>
              {COUNTER_BOOKING_LABEL}
            </Button>
          )
        }
      />
    </div>
  )
}
