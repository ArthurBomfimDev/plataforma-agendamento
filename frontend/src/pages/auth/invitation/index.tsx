import { ApiError, errorMessage } from '@api/base'
import { ROUTES, SEARCH_PARAMS, invitationPath, signInPath } from '@router/paths'
import { useAcceptInvitation, useInvitationPreview } from '@api/services/invitation/hooks'
import { useNavigate, useSearchParams } from 'react-router'

import { InvitationScreen } from './screen'
import type { InvitationAccess, InvitationInvalidReason } from './screen/types'
import { notify } from '@components/toaster/notify'
import { useMe } from '@api/services/auth/hooks'
import { useSessionStore } from '@store/session'

const INVALID_CODES: Record<string, InvitationInvalidReason> = {
  'invitation.not_found': 'not_found',
  'invitation.expired': 'expired',
  'invitation.revoked': 'revoked',
  'invitation.already_used': 'used',
}

const invalidReason = (error: unknown): InvitationInvalidReason | undefined =>
  error instanceof ApiError && error.code ? INVALID_CODES[error.code] : undefined

/**
 * `#/convite?token=` — o link do e-mail de convite de equipe (ADR-029). Mostra o estabelecimento e quem convidou e
 * leva a pessoa por um de quatro caminhos: criar conta, entrar, aceitar logada ou sair (conta de outro e-mail).
 * Depois de aceitar, abre o painel do estabelecimento novo.
 */
export const InvitationRoute = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get(SEARCH_PARAMS.token)
  const signedIn = useSessionStore((state) => state.session !== null)
  const signOut = useSessionStore((state) => state.signOut)

  const preview = useInvitationPreview(token)
  const me = useMe()
  const accept = useAcceptInvitation()

  const signIn = () => navigate(signInPath(token ? invitationPath(token) : undefined))
  const onAccepted = () => {
    notify.success('Convite aceito. Bem-vindo(a) à equipe!')
    navigate(ROUTES.panel, { replace: true })
  }

  if (!token)
    return (
      <InvitationScreen state="invalid" reason="not_found" onHome={() => navigate(ROUTES.home)} />
    )

  if (preview.isPending) return <InvitationScreen state="loading" />

  if (preview.isError) {
    const reason = invalidReason(preview.error)
    return reason ? (
      <InvitationScreen
        state="invalid"
        reason={reason}
        onSignIn={signIn}
        onHome={() => navigate(ROUTES.home)}
      />
    ) : (
      <InvitationScreen
        state="error"
        message={errorMessage(preview.error)}
        onRetry={() => void preview.refetch()}
      />
    )
  }

  // Logado, a conta só se conhece depois do `GET /me`: enquanto ele não chega, é carregamento.
  if (signedIn && me.isPending) return <InvitationScreen state="loading" />

  if (signedIn && me.isError) {
    return (
      <InvitationScreen
        state="error"
        message={errorMessage(me.error)}
        onRetry={() => void me.refetch()}
      />
    )
  }

  const data = preview.data
  const currentEmail = signedIn ? me.data?.email : undefined
  const access: InvitationAccess = !signedIn
    ? data.accountExists
      ? 'existing'
      : 'new'
    : currentEmail?.toLowerCase() === data.email.toLowerCase()
      ? 'match'
      : 'other'

  return (
    <InvitationScreen
      state="ready"
      preview={data}
      access={access}
      currentEmail={currentEmail}
      submitting={accept.isPending}
      error={accept.isError ? errorMessage(accept.error) : undefined}
      onCreateAccount={({ fullName, password, acceptTerms }) =>
        accept.mutate(
          { kind: 'new-account', token, email: data.email, fullName, password, acceptTerms },
          { onSuccess: onAccepted },
        )
      }
      onAccept={(acceptTerms) =>
        me.data &&
        accept.mutate(
          { kind: 'signed-in', token, userId: me.data.id, acceptTerms },
          { onSuccess: onAccepted },
        )
      }
      onSignIn={signIn}
      onSignOut={() => {
        signOut()
        navigate(signInPath(invitationPath(token)), { replace: true })
      }}
    />
  )
}
