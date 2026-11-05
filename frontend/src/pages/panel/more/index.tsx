import { ROUTES, hiddenSectionsFor } from '@router/paths'

import { PanelMoreScreen } from './screen'
import { errorMessage } from '@api/base'
import { useLeaveBusiness } from '@api/services/professional/hooks'
import { useNavigate } from 'react-router'
import { usePanelContext } from '@layouts/panel-layout/context'

/** "Mais" do celular (Onda 7D): as outras seções e a conta (`#/context`, sem mudança da 7A). */
export const PanelMoreRoute = () => {
  const { context, business, navigateTo } = usePanelContext()
  const navigate = useNavigate()
  const leave = useLeaveBusiness()

  return (
    <PanelMoreScreen
      businessName={business.name}
      hiddenSections={hiddenSectionsFor(context.role)}
      onNavigate={navigateTo}
      onAccount={() => navigate(ROUTES.chooseContext)}
      // O dono não sai do próprio estabelecimento; atendente e profissional, sim.
      onLeave={
        context.role === 'Owner'
          ? undefined
          : async () => {
              try {
                await leave.mutateAsync()
                navigate(ROUTES.home, { replace: true })
                return null
              } catch (error) {
                return errorMessage(error)
              }
            }
      }
    />
  )
}
