import {
  type CheckEmailState,
  SEARCH_PARAMS,
  safeRedirect,
  signInPath,
  signUpPath,
} from '@router/paths'
import { useLocation, useNavigate, useSearchParams } from 'react-router'

import { CheckEmailScreen } from './screen'
import { errorMessage } from '@api/base'
import { secondsUntilResend } from './screen/consts'
import { useNow } from '@hooks/use-now'
import { useResendConfirmation } from '@api/services/auth/hooks'
import { useState } from 'react'

const readState = (state: unknown): CheckEmailState | null => {
  const candidate = state as Partial<CheckEmailState> | null
  return typeof candidate?.email === 'string' && typeof candidate.sentAt === 'number'
    ? { email: candidate.email, sentAt: candidate.sentAt }
    : null
}

/** "Confira seu e-mail": o endereço e o instante do envio vêm do cadastro, pelo estado da navegação. */
export const CheckEmailRoute = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const redirect = safeRedirect(searchParams.get(SEARCH_PARAMS.redirect))
  const initial = readState(location.state)

  const [sentAt, setSentAt] = useState(() => initial?.sentAt ?? Date.now())
  const [status, setStatus] = useState<string>()
  const now = useNow(1_000)
  const resend = useResendConfirmation()

  return (
    <CheckEmailScreen
      email={initial?.email ?? null}
      secondsLeft={secondsUntilResend(sentAt, now.getTime())}
      resending={resend.isPending}
      status={status}
      error={resend.isError ? errorMessage(resend.error) : undefined}
      onResend={() => {
        if (!initial) return
        setStatus(undefined)
        resend.mutate(initial.email, {
          onSuccess: () => {
            setSentAt(Date.now())
            setStatus('Enviamos um novo link. Pode levar alguns minutos para chegar.')
          },
        })
      }}
      onUseAnotherEmail={() => navigate(signUpPath(redirect), { replace: true })}
      onSignIn={() => navigate(signInPath(redirect ?? undefined))}
    />
  )
}
