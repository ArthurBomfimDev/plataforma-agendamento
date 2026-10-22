import { ROUTES, SEARCH_PARAMS, safeRedirect, signUpPath } from './consts'
import { useNavigate, useSearchParams } from 'react-router'

import { SignInScreen } from '@features/sign-in'
import { errorMessage } from '@lib/api/errors'
import { toast } from '@lib/toast'
import { useSignIn } from '@lib/api/queries'

/**
 * Entrar com e-mail e senha (módulo Identity). Volta para onde o consumidor estava, se veio de
 * uma tela que exige sessão.
 *
 * TODO: "Esqueci minha senha" é a tela A05, ainda não implementada (o endpoint já existe).
 * TODO: o lado "estabelecimento" entra, mas o painel do estabelecimento ainda não existe.
 */
export const SignInRoute = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = safeRedirect(searchParams.get(SEARCH_PARAMS.redirect))
  const signIn = useSignIn()

  return (
    <SignInScreen
      submitting={signIn.isPending}
      error={signIn.isError ? errorMessage(signIn.error) : undefined}
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
      onForgotPassword={() => toast.info('Recuperar senha ainda não está disponível.')}
    />
  )
}
