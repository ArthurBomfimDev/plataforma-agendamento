import {
  type CheckEmailState,
  SEARCH_PARAMS,
  checkEmailPath,
  safeRedirect,
  signInPath,
} from '@router/paths'
import { useNavigate, useSearchParams } from 'react-router'

import { SignUpScreen } from './screen'
import { errorMessage } from '@api/base'
import { useSignUp } from '@api/services/auth/hooks'

/**
 * Criar conta. Desde a Onda 6A não abre sessão: vai para "Confira seu e-mail", e o login só vale
 * depois de confirmar. O endereço segue no estado da navegação, nunca na URL.
 */
export const SignUpRoute = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = safeRedirect(searchParams.get(SEARCH_PARAMS.redirect))
  const signUp = useSignUp()

  return (
    <SignUpScreen
      submitting={signUp.isPending}
      error={signUp.isError ? errorMessage(signUp.error) : undefined}
      onSubmit={(values) =>
        signUp.mutate(values, {
          onSuccess: () => {
            const state: CheckEmailState = { email: values.email, sentAt: Date.now() }
            navigate(checkEmailPath(redirect), { replace: true, state })
          },
        })
      }
      onSignIn={() => navigate(signInPath(redirect ?? undefined))}
    />
  )
}
