import type { NewTeamMemberDraft } from '../../types'

export type NewMemberSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Resolve `null` se gravou, senão a mensagem de erro. */
  onCreate: (draft: NewTeamMemberDraft) => Promise<string | null>
}
