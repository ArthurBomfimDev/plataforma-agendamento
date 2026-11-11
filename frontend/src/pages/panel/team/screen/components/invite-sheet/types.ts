import type { InviteDraft } from '../../types'

export type InviteSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Perfis de profissional ativos e sem conta, que o convite pode ligar à conta nova. */
  linkable: Array<{ id: string; name: string }>
  /** Resolve `null` se enviou, senão a mensagem de erro. */
  onInvite: (draft: InviteDraft) => Promise<string | null>
}
