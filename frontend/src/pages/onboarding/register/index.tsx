import { ROUTES } from '@router/paths'
import { UserMessageError, errorMessage } from '@api/base'
import { locateAddress } from './screen/components/address-location/consts'
import {
  useAcceptTerms,
  useConfirmLocation,
  useOwnerBusiness,
  useRegisterBusiness,
  useSetResponsible,
  useUpdateAddress,
} from '@api/services/onboarding/hooks'
import { useBusinessContext, useMe, useSwitchContext } from '@api/services/auth/hooks'
import { useNavigate, useSearchParams } from 'react-router'

import type { AddressValues } from './screen/types'
import { ErrorScreen, LoadingScreen } from '@components/screen-state'
import { OwnerAccount } from './account'
import { RegisterBusinessScreen } from './screen'
import { RequireSession } from '@router/guards/require-session'
import { TERMS_VERSION } from './screen/consts'
import { geoService } from '@api/services/geo'
import { useSessionStore } from '@store/session'

const RegisterBusiness = () => {
  const navigate = useNavigate()
  const resume = useSearchParams()[0].get('retomar') === '1'
  const context = useBusinessContext()
  const me = useMe()

  const register = useRegisterBusiness()
  const switchContext = useSwitchContext()
  const updateAddress = useUpdateAddress()
  const confirmLocation = useConfirmLocation()
  const setResponsible = useSetResponsible()
  const acceptTerms = useAcceptTerms()

  // Retomar: só quando já se está no contexto de um estabelecimento, o do rascunho.
  const resuming = resume && context !== null
  const draft = useOwnerBusiness(context?.businessId ?? '', resuming)

  if (resuming && draft.isPending) return <LoadingScreen label="Abrindo o seu cadastro…" />
  if (resuming && draft.isError) {
    return <ErrorScreen message={errorMessage(draft.error)} onRetry={() => void draft.refetch()} />
  }

  const saved = resuming ? draft.data : undefined
  const attempt = async (task: () => Promise<unknown>) => {
    try {
      await task()
      return null
    } catch (error) {
      return errorMessage(error)
    }
  }

  return (
    <RegisterBusinessScreen
      initialStep={saved ? 'address' : undefined}
      createdCategory={saved?.category}
      savedAddress={
        saved && {
          postalCode: saved.address.postalCode ?? '',
          street: saved.address.street ?? '',
          streetNumber: saved.address.streetNumber ?? '',
          district: saved.address.district ?? '',
          city: saved.address.city ?? '',
          state: saved.address.state ?? '',
        }
      }
      onCreate={(business, document) =>
        attempt(async () => {
          if (!me.data) {
            throw new UserMessageError('Carregando a sua conta. Tente de novo em instantes.')
          }
          const created = await register.mutateAsync({ ...business, ...document })
          // O estabelecimento nasce em rascunho; o painel e as rotas `current/*` dependem do contexto dele.
          await switchContext.mutateAsync({
            userId: me.data.id,
            business: { businessId: created.id, name: created.name, role: 'Owner' },
          })
        })
      }
      onLocateAddress={async (address: AddressValues) => {
        try {
          // O PUT só grava o endereço (e desfaz a confirmação anterior); quem acha o ponto é a busca.
          await updateAddress.mutateAsync({
            street: address.street.trim(),
            streetNumber: address.streetNumber.trim(),
            district: address.district.trim(),
            city: address.city.trim(),
            state: address.state.trim().toUpperCase(),
            postalCode: address.postalCode.replace(/\D/g, ''),
          })
          const places = await locateAddress(
            address,
            async (text) => (await geoService.search(text)).items,
          )
          return places.length > 0 ? { status: 'found', places } : { status: 'not-found' }
        } catch (error) {
          return { status: 'error', message: errorMessage(error) }
        }
      }}
      onConfirmLocation={(place) =>
        attempt(() =>
          confirmLocation.mutateAsync({
            latitude: place.latitude,
            longitude: place.longitude,
            precision: place.precision,
            source: 'owner-confirmed',
          }),
        )
      }
      onSaveResponsible={(responsible) => attempt(() => setResponsible.mutateAsync(responsible))}
      onFinish={() => attempt(() => acceptTerms.mutateAsync(TERMS_VERSION))}
      onLookupPostalCode={async (postalCode) => {
        try {
          return await geoService.postalCode(postalCode.replace(/\D/g, ''))
        } catch {
          return null
        }
      }}
      onLeave={() => navigate(context ? ROUTES.panel : ROUTES.home)}
    />
  )
}

/**
 * `#/cadastrar-estabelecimento`: cadastrar um estabelecimento. Com sessão, é o assistente (e-mail confirmado, como todo
 * login). Sem sessão, o primeiro passo é "Sua conta" (ADR-034), em vez de mandar a pessoa criar uma conta comum antes.
 */
export const RegisterBusinessRoute = () => {
  const signedIn = useSessionStore((state) => state.session !== null)

  return signedIn ? (
    <RequireSession>
      <RegisterBusiness />
    </RequireSession>
  ) : (
    <OwnerAccount />
  )
}
