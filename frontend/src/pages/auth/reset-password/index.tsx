import { ApiError, errorMessage } from '@api/base'
import { ROUTES, SEARCH_PARAMS } from '@router/paths'
import { useNavigate, useSearchParams } from 'react-router'

import { ResetPasswordScreen } from './screen'
import type { ResetPasswordState } from './screen/types'
import { useResetPassword } from '@api/services/auth/hooks'

const isInvalidToken = (error: unknown) =>
  error instanceof ApiError && error.code === 'user_token.invalid'

/** `#/redefinir-senha?token=` — o link do e-mail de "Esqueci minha senha" (Onda 5B). */
export const ResetPasswordRoute = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get(SEARCH_PARAMS.token)
  const reset = useResetPassword()

  const state: ResetPasswordState =
    !token || (reset.isError && isInvalidToken(reset.error))
      ? 'invalid'
      : reset.isSuccess
        ? 'success'
        : 'form'

  return (
    <ResetPasswordScreen
      state={state}
      submitting={reset.isPending}
      error={reset.isError && !isInvalidToken(reset.error) ? errorMessage(reset.error) : undefined}
      onSubmit={(newPassword) => token && reset.mutate({ token, newPassword })}
      onSignIn={() => navigate(ROUTES.signIn, { replace: true })}
      onRequestNewLink={() => navigate(ROUTES.forgotPassword, { replace: true })}
    />
  )
}
