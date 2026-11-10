import {
  type CheckEmailState,
  checkEmailPath,
  registerBusinessPath,
  signInPath,
} from '@router/paths'

import { OwnerAccountScreen } from './screen'
import { errorMessage } from '@api/base'
import { rememberNext } from '@router/pending-next'
import { useNavigate } from 'react-router'
import { useRegisterOwnerAccount } from '@api/services/auth/hooks'

/**
 * O passo "Sua conta" do assistente, para quem chega sem sessão (ADR-034). Cria a conta com o POST de cadastro de
 * sempre; o cadastro não abre sessão, então segue para "Confira seu e-mail", e o destino (o assistente) fica guardado
 * para o login levar a pessoa de volta depois da confirmação.
 */
export const OwnerAccount = () => {
  const navigate = useNavigate()
  const signUp = useRegisterOwnerAccount()
  const next = registerBusinessPath()

  return (
    <OwnerAccountScreen
      submitting={signUp.isPending}
      error={signUp.isError ? errorMessage(signUp.error) : undefined}
      onSubmit={(values) =>
        signUp.mutate(values, {
          onSuccess: () => {
            rememberNext(values.email, next)
            const state: CheckEmailState = { email: values.email, sentAt: Date.now() }
            navigate(checkEmailPath(next), { replace: true, state })
          },
        })
      }
      onSignIn={() => navigate(signInPath(undefined, next))}
    />
  )
}
