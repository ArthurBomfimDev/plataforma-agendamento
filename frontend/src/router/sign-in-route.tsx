import {
  type CheckEmailState,
  ROUTES,
  SEARCH_PARAMS,
  checkEmailPath,
  safeRedirect,
  signUpPath,
} from './consts'
import { useNavigate, useSearchParams } from 'react-router'
import { useResendConfirmation, useSignIn } from '@lib/api/queries'

import { ApiError, errorMessage } from '@lib/api/errors'
import { SignInScreen } from '@features/sign-in'
import { toast } from '@lib/toast'

/**
 * Entrar com e-mail e senha (módulo Identity). Volta para onde o consumidor estava, se veio de
 * uma tela que exige sessão. Conta sem e-mail confirmado recebe 403 e o botão de reenvio.
 *
 * TODO: o lado "estabelecimento" entra, mas o painel do estabelecimento ainda não existe.
 */
export const SignInRoute = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = safeRedirect(searchParams.get(SEARCH_PARAMS.redirect))
  const signIn = useSignIn()
  const resend = useResendConfirmation()

  const unconfirmed =
    signIn.error instanceof ApiError && signIn.error.code === 'identity.email_not_confirmed'

  return (
    <SignInScreen
      submitting={signIn.isPending}
      error={signIn.isError ? errorMessage(signIn.error) : undefined}
      unconfirmed={unconfirmed}
      resending={resend.isPending}
      onResendConfirmation={(email) =>
        resend.mutate(email, {
          onSuccess: () => {
            const state: CheckEmailState = { email, sentAt: Date.now() }
            navigate(checkEmailPath(redirect), { state })
          },
          onError: (error) => toast.error(errorMessage(error)),
        })
      }
      onSubmit={({ email, password, role }) =>
        signIn.mutate(
          { email, password },
          {
            onSuccess: () => {
              if (role === 'business') {
                toast.info('O painel do estabelecimento ainda não está disponível.')
              }
              navigate(redirect ?? ROUTES.home, { replace: true })
            },
          },
        )
      }
      onCreateAccount={() => navigate(signUpPath(redirect))}
      onForgotPassword={() => navigate(ROUTES.forgotPassword)}
    />
  )
}
