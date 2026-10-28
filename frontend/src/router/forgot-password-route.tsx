import { ForgotPasswordScreen } from '@features/forgot-password'
import { ROUTES } from './consts'
import { errorMessage } from '@lib/api/errors'
import { useForgotPassword } from '@lib/api/queries'
import { useNavigate } from 'react-router'

export const ForgotPasswordRoute = () => {
  const navigate = useNavigate()
  const forgot = useForgotPassword()

  return (
    <ForgotPasswordScreen
      submitting={forgot.isPending}
      sent={forgot.isSuccess}
      error={forgot.isError ? errorMessage(forgot.error) : undefined}
      onSubmit={(email) => forgot.mutate(email)}
      onBack={() => navigate(ROUTES.signIn)}
    />
  )
}
