import {
  type CheckEmailState,
  ROUTES,
  SEARCH_PARAMS,
  checkEmailPath,
  safeNext,
  safeRedirect,
  signUpPath,
} from '@router/paths'
import { clearNext, readNext, rememberNext } from '@router/pending-next'
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
 *
 * O destino vem de `redirect` (caminho interno) ou de `next` (lista fechada). Sem nenhum dos dois, vale o destino que o
 * cadastro deixou guardado para este e-mail, porque o link de confirmação do e-mail não o carrega (ADR-034).
 */
const isPanelPath = (path: string | null) =>
  path === ROUTES.panel || Boolean(path?.startsWith(`${ROUTES.panel}/`))

/** Um link do painel pede o painel; outra tela de consumidor, consumidor. */
const entryIntent = (redirect: string | null): EntryIntent =>
  isPanelPath(redirect) ? 'business' : redirect ? 'customer' : 'auto'

export const SignInRoute = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect =
    safeRedirect(searchParams.get(SEARCH_PARAMS.redirect)) ??
    safeNext(searchParams.get(SEARCH_PARAMS.next))
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
            // Conta ainda sem confirmação: guarda para onde voltar (ex.: o convite que a pessoa ia aceitar).
            rememberNext(email, redirect)
            const state: CheckEmailState = { email, sentAt: Date.now() }
            navigate(checkEmailPath(redirect), { state })
          },
          onError: (error) => notify.error(error),
        })
      }
      onSubmit={({ email, password }) => {
        const target = redirect ?? readNext(email)
        signIn.mutate(
          { email, password },
          {
            onError: (error) => {
              if (error instanceof ApiError && error.code === 'identity.email_not_confirmed') {
                rememberNext(email, redirect)
              }
            },
            onSuccess: () =>
              // A tela inicial depende do contexto (decisão de 22/09, §2.0): ver `chooseEntry`.
              enter.mutate(entryIntent(target), {
                onSuccess: (entry) => {
                  clearNext()
                  if (entry.kind === 'business') {
                    // Veio de um link do painel (e-mail ao dono): volta para ele.
                    navigate(isPanelPath(target) ? target! : ROUTES.panelRequests, {
                      replace: true,
                    })
                  } else if (entry.kind === 'choose') {
                    navigate(ROUTES.chooseContext, { replace: true })
                  } else {
                    if (isPanelPath(target)) {
                      notify.info(
                        'Esta conta não tem um estabelecimento. Você entrou como consumidor.',
                      )
                    }
                    navigate(isPanelPath(target) ? ROUTES.home : (target ?? ROUTES.home), {
                      replace: true,
                    })
                  }
                },
                // Sem a lista de contextos, entra como consumidor: a sessão já está aberta.
                onError: () => {
                  clearNext()
                  navigate(ROUTES.home, { replace: true })
                },
              }),
          },
        )
      }}
      onCreateAccount={() => navigate(signUpPath(redirect))}
      onForgotPassword={() => navigate(ROUTES.forgotPassword)}
    />
  )
}
