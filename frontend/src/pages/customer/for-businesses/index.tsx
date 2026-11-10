import { registerBusinessPath, signInPath } from '@router/paths'

import { ForBusinessesScreen } from './screen'
import { useNavigate } from 'react-router'
import { useSessionStore } from '@store/session'

/** `#/para-estabelecimentos`: pública. O botão leva ao assistente, que pede a conta se faltar (ADR-034). */
export const ForBusinessesRoute = () => {
  const navigate = useNavigate()
  const signedIn = useSessionStore((state) => state.session !== null)

  return (
    <ForBusinessesScreen
      signedIn={signedIn}
      onRegister={() => navigate(registerBusinessPath())}
      onSignIn={() => navigate(signInPath())}
    />
  )
}
