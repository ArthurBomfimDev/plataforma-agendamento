import type { TeamMemberResponse } from '@api/models'

export type MembersData =
  | { status: 'loading' }
  | { status: 'error'; message: string; onRetry: () => void }
  | { status: 'ready'; members: TeamMemberResponse[] }

export type MembersScreenProps = {
  data: MembersData
  businessName: string
}
