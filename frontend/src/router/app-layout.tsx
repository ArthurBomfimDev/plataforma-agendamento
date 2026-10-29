import { Outlet, useMatch, useNavigate } from 'react-router'

import { AccountMenu } from '@components/account-menu'
import { LocationPicker } from '@components/location-picker'
import { ROUTES, searchPath } from './consts'
import { TopBar } from '@components/top-bar'
import { toast } from '@lib/toast'
import { useAccountMenu } from './use-account-menu'
import { useBusinessContext, useSignOut } from '@lib/api/queries'
import { useLocationStore } from '@lib/zustand/location'
import { useSessionStore } from '@lib/zustand/session'

/**
 * Moldura comum às telas do consumidor: a barra superior do desktop. No celular ela não aparece.
 * No contexto de estabelecimento, a barra perde o que é de consumidor e oferece voltar ao painel.
 */
export const AppLayout = () => {
  const navigate = useNavigate()
  const isHome = useMatch(ROUTES.home) !== null
  // Home e resultados têm a busca no próprio cabeçalho: na barra, ela seria repetida.
  const isSearch = useMatch(ROUTES.search) !== null
  const signedIn = useSessionStore((state) => state.session !== null)
  const context = useBusinessContext()
  const accountMenu = useAccountMenu()
  const signOut = useSignOut()
  const locationLabel = useLocationStore((state) => state.location?.label ?? null)
  const openPicker = useLocationStore((state) => state.openPicker)

  return (
    <>
      <TopBar
        showSearch={!isHome && !isSearch}
        onSearch={(term) => navigate(searchPath({ term }))}
        signedIn={signedIn}
        locationLabel={locationLabel}
        onChooseLocation={openPicker}
        onHome={() => navigate(ROUTES.home)}
        onAppointments={() => navigate(ROUTES.appointments)}
        onSignIn={() => navigate(ROUTES.signIn)}
        onSignOut={() => {
          signOut()
          toast.info('Você saiu da sua conta.')
          navigate(ROUTES.home)
        }}
        accountMenu={accountMenu && <AccountMenu {...accountMenu} />}
        onOpenPanel={context ? () => navigate(ROUTES.panelRequests) : undefined}
      />
      <Outlet />
      <LocationPicker />
    </>
  )
}
