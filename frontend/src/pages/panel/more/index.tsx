import { OWNER_ONLY_SECTIONS, ROUTES, canManageBusiness } from '@router/paths'

import { PanelMoreScreen } from './screen'
import { useNavigate } from 'react-router'
import { usePanelContext } from '@layouts/panel-layout/context'

/** "Mais" do celular (Onda 7D): as outras seções e a conta (`#/context`, sem mudança da 7A). */
export const PanelMoreRoute = () => {
  const { context, business, navigateTo } = usePanelContext()
  const navigate = useNavigate()

  return (
    <PanelMoreScreen
      businessName={business.name}
      hiddenSections={canManageBusiness(context.role) ? [] : OWNER_ONLY_SECTIONS}
      onNavigate={navigateTo}
      onAccount={() => navigate(ROUTES.chooseContext)}
    />
  )
}
