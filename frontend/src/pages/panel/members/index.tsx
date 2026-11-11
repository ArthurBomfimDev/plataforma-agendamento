import type { MembersData } from './screen/types'
import { MembersScreen } from './screen'
import { errorMessage } from '@api/base'
import { usePanelContext } from '@layouts/panel-layout/context'
import { usePanelMembers } from '@api/services/invitation/hooks'

/** Painel — Equipe. Só o dono (`RequireOwner`); a API recusa os outros com 403. */
export const PanelMembersRoute = () => {
  const { context, business } = usePanelContext()
  const members = usePanelMembers(context.businessId)

  const data: MembersData = members.isError
    ? {
        status: 'error',
        message: errorMessage(members.error),
        onRetry: () => void members.refetch(),
      }
    : members.data
      ? { status: 'ready', members: members.data }
      : { status: 'loading' }

  return <MembersScreen data={data} businessName={business.name} />
}
