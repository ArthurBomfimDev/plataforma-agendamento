import type { InvitesData } from '../../types'

export type InvitesCardProps = {
  data: InvitesData
  onInvite: () => void
  /** Resolvem `null` se deu certo, senão a mensagem de erro. */
  onResend: (inviteId: string) => Promise<string | null>
  onRevoke: (inviteId: string) => Promise<string | null>
}
