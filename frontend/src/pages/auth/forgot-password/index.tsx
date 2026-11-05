import { ForgotPasswordScreen } from './screen'
import { ROUTES } from '@router/paths'
import { errorMessage } from '@api/base'
import { useForgotPassword } from '@api/services/auth/hooks'
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
