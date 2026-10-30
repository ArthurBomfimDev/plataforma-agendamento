import { type ChooseContextState, ROUTES } from './consts'

import { Navigate } from 'react-router'
import type { ReactNode } from 'react'
import { useBusinessContext } from '@lib/api/queries'

/**
 * Telas que dependem do perfil de consumidor (agendar, "Meus agendamentos") não abrem no contexto de
 * estabelecimento: a API recusaria (`appointment.customer_context_required`). Leva à conta, que
 * oferece "Consumidor" — ou diz que a conta não tem esse perfil.
 */
export const RequireCustomerContext = ({ children }: { children: ReactNode }) => {
  const context = useBusinessContext()

  if (context) {
    const state: ChooseContextState = { reason: 'customer' }
    return <Navigate to={ROUTES.chooseContext} replace state={state} />
  }

  return children
}
