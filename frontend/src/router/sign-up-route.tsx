import { ROUTES, SEARCH_PARAMS, safeRedirect, signInPath } from './consts'
import { useNavigate, useSearchParams } from 'react-router'

import { SignUpScreen } from '@features/sign-up'
import { errorMessage } from '@lib/api/errors'
import { toast } from '@lib/toast'
import { useSignUp } from '@lib/api/queries'

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
            toast.success('Conta criada. Enviamos um e-mail de confirmação.')
            navigate(redirect ?? ROUTES.home, { replace: true })
          },
        })
      }
      onSignIn={() => navigate(signInPath(redirect ?? undefined))}
    />
  )
}
