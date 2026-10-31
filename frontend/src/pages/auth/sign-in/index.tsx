import {
  type CheckEmailState,
  ROUTES,
  SEARCH_PARAMS,
  checkEmailPath,
  safeRedirect,
  signUpPath,
} from '@router/paths'
import { useNavigate, useSearchParams } from 'react-router'
import { useEnterAccount, useResendConfirmation, useSignIn } from '@api/services/auth/hooks'

import { ApiError, errorMessage } from '@api/base'
import type { EntryIntent } from '@api/services/auth/context'
import { SignInScreen } from './screen'
import { notify } from '@components/toaster/notify'

/**
 * Entrar com e-mail e senha (módulo Identity). Volta para onde o consumidor estava, se veio de
 * uma tela que exige sessão. Conta sem e-mail confirmado recebe 403 e o botão de reenvio.
 *
 * Depois de entrar, abre o contexto certo: o painel para quem só tem estabelecimento, o último
 * usado para quem tem os dois, a escolha para quem tem vários (Onda 7A).
 */
const isPanelPath = (path: string | null) =>
  path === ROUTES.panel || Boolean(path?.startsWith(`${ROUTES.panel}/`))

/** "Sou estabelecimento" ou um link do painel pedem o painel; outra tela de consumidor, consumidor. */
const entryIntent = (role: 'customer' | 'business', redirect: string | null): EntryIntent =>
  role === 'business' || isPanelPath(redirect) ? 'business' : redirect ? 'customer' : 'auto'

export const SignInRoute = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = safeRedirect(searchParams.get(SEARCH_PARAMS.redirect))
  const signIn = useSignIn()
  const enter = useEnterAccount()
  const resend = useResendConfirmation()

  const unconfirmed =
    signIn.error instanceof ApiError && signIn.error.code === 'identity.email_not_confirmed'

  return (
    <SignInScreen
      submitting={signIn.isPending || enter.isPending}
      error={signIn.isError ? errorMessage(signIn.error) : undefined}
      unconfirmed={unconfirmed}
      resending={resend.isPending}
      onResendConfirmation={(email) =>
        resend.mutate(email, {
          onSuccess: () => {
            const state: CheckEmailState = { email, sentAt: Date.now() }
            navigate(checkEmailPath(redirect), { state })
          },
          onError: (error) => notify.error(error),
        })
      }
      onSubmit={({ email, password, role }) =>
        signIn.mutate(
          { email, password },
          {
            onSuccess: () =>
              // A tela inicial depende do contexto (decisão de 22/09, §2.0): ver `chooseEntry`.
              enter.mutate(entryIntent(role, redirect), {
                onSuccess: (entry) => {
                  if (entry.kind === 'business') {
                    // Veio de um link do painel (e-mail ao dono): volta para ele.
                    navigate(isPanelPath(redirect) ? redirect! : ROUTES.panelRequests, {
                      replace: true,
                    })
                  } else if (entry.kind === 'choose') {
                    navigate(ROUTES.chooseContext, { replace: true })
                  } else {
                    if (role === 'business' || isPanelPath(redirect)) {
                      notify.info(
                        'Esta conta não tem um estabelecimento. Você entrou como consumidor.',
                      )
                    }
                    navigate(isPanelPath(redirect) ? ROUTES.home : (redirect ?? ROUTES.home), {
                      replace: true,
                    })
                  }
                },
                // Sem a lista de contextos, entra como consumidor: a sessão já está aberta.
                onError: () => navigate(ROUTES.home, { replace: true }),
              }),
          },
        )
      }
      onCreateAccount={() => navigate(signUpPath(redirect))}
      onForgotPassword={() => navigate(ROUTES.forgotPassword)}
    />
  )
}
