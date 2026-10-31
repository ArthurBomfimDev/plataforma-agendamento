import { ApiError, errorMessage } from '@api/base'
import { ROUTES, SEARCH_PARAMS } from '@router/paths'
import { useConfirmEmail, useResendConfirmation } from '@api/services/auth/hooks'
import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router'

import { ConfirmEmailScreen } from './screen'
import type { ConfirmEmailState } from './screen/types'
import { ErrorScreen } from '@components/screen-state'

const isInvalidToken = (error: unknown) =>
  error instanceof ApiError && (error.code === 'user_token.invalid' || error.status === 400)

/**
 * `#/confirmar-email?token=` — o link do e-mail de cadastro (Onda 5B). Confirma assim que abre.
 *
 * O token vale uma vez: o `StrictMode` monta o efeito duas vezes em desenvolvimento, e a segunda
 * chamada leria "link já usado". A referência guarda qual token já foi enviado.
 */
export const ConfirmEmailRoute = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get(SEARCH_PARAMS.token)
  const confirm = useConfirmEmail()
  const resend = useResendConfirmation()
  const sent = useRef<string | null>(null)

  useEffect(() => {
    if (!token || sent.current === token) return
    sent.current = token
    confirm.mutate(token)
  }, [token, confirm])

  if (confirm.isError && !isInvalidToken(confirm.error)) {
    return (
      <ErrorScreen
        message={errorMessage(confirm.error)}
        onRetry={() => token && confirm.mutate(token)}
      />
    )
  }

  const state: ConfirmEmailState =
    !token || confirm.isError ? 'invalid' : confirm.isSuccess ? 'success' : 'loading'

  return (
    <ConfirmEmailScreen
      state={state}
      onSignIn={() => navigate(ROUTES.signIn, { replace: true })}
      resending={resend.isPending}
      resent={resend.isSuccess}
      resendError={resend.isError ? errorMessage(resend.error) : undefined}
      onResend={(email) => resend.mutate(email)}
    />
  )
}
