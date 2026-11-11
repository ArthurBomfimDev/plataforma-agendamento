import type {
  ExceptionChoice,
  ExceptionDraft,
  ExceptionItem,
  Loadable,
} from '../schedules/screen/types'
import { exceptionPeriod, toAffectedItem, toExceptionItem } from '../manage-adapters'
import { usePanelExceptions, useMyProfessionalProfile } from '@api/services/management/hooks'

import type { BlockProfessional } from './screen/types'
import { BlocksScreen } from './screen'
import { errorMessage } from '@api/base'
import { exceptionWhenLabel } from '../schedules/screen/consts'
import { managementService } from '@api/services/management'
import { notify } from '@components/toaster/notify'
import { usePanelContext } from '@layouts/panel-layout/context'
import { usePanelMutation } from '@api/services/panel/hooks'

/** Uma gravação que resolve `null` se deu certo, senão a mensagem em português. */
const attempt = async (task: () => Promise<unknown>) => {
  try {
    await task()
    return null
  } catch (error) {
    return errorMessage(error)
  }
}

/**
 * Painel — Folgas e bloqueios (ADR-030): atendente (todos os profissionais e o estabelecimento inteiro) e profissional
 * (só a própria agenda). O profissional descobre o próprio perfil por `professionals/me`. O servidor confere o escopo
 * de novo (403), então a tela não é a única trava.
 */
export const PanelBlocksRoute = () => {
  const { context, business, professionals, today } = usePanelContext()
  const { timeZone } = business
  const own = context.role === 'Professional'

  const mine = useMyProfessionalProfile(context.businessId, own)
  const exceptionsQuery = usePanelExceptions(context.businessId)

  const addException = usePanelMutation(
    context.businessId,
    ({ draft, choice }: { draft: ExceptionDraft; choice: ExceptionChoice }) =>
      managementService.addException({
        professionalId: draft.professionalId,
        kind: draft.kind,
        ...exceptionPeriod(draft, timeZone),
        reason: draft.reason,
        existingAppointments: choice.existingAppointments,
        cancellationReason: choice.cancellationReason,
      }),
  )
  const removeException = usePanelMutation(context.businessId, (item: ExceptionItem) =>
    managementService.removeException(item.id),
  )

  const nameOf = (id: string) =>
    professionals.find((professional) => professional.id === id)?.displayName ?? 'Profissional'

  const team: Loadable<BlockProfessional> = own
    ? mine.isError
      ? { status: 'error', message: errorMessage(mine.error), onRetry: () => void mine.refetch() }
      : mine.data
        ? {
            status: 'ready',
            items: [{ id: mine.data.id, name: mine.data.displayName, photo: mine.data.photo }],
          }
        : { status: 'loading' }
    : {
        status: 'ready',
        items: professionals.map(({ id, displayName, photo }) => ({
          id,
          name: displayName,
          photo,
        })),
      }

  const exceptions: Loadable<ExceptionItem> = exceptionsQuery.isError
    ? {
        status: 'error',
        message: errorMessage(exceptionsQuery.error),
        onRetry: () => void exceptionsQuery.refetch(),
      }
    : exceptionsQuery.data && (!own || mine.data)
      ? {
          status: 'ready',
          // O profissional só vê e remove o que é dele; o resto responderia 403.
          items: exceptionsQuery.data
            .filter((exception) => !own || exception.professionalId === mine.data?.id)
            .map((exception) => toExceptionItem(exception, timeZone, nameOf)),
        }
      : { status: 'loading' }

  return (
    <BlocksScreen
      businessName={business.name}
      today={today}
      professionals={team}
      allowWholeBusiness={!own}
      exceptions={exceptions}
      onPreviewBlock={async (draft) => {
        try {
          const result = await managementService.affectedAppointments({
            ...exceptionPeriod(draft, timeZone),
            professionalId: draft.professionalId,
          })
          return result.items.map((appointment) =>
            toAffectedItem(appointment, timeZone, nameOf, draft.professionalId === null),
          )
        } catch (error) {
          return errorMessage(error)
        }
      }}
      onBlock={(draft, choice) =>
        attempt(async () => {
          const saved = await addException.mutateAsync({ draft, choice })
          const when = exceptionWhenLabel(toExceptionItem(saved, timeZone, nameOf))
          notify.success(
            saved.cancelledAppointments > 0
              ? `Bloqueio salvo (${when}). ${saved.cancelledAppointments} ${saved.cancelledAppointments === 1 ? 'agendamento cancelado' : 'agendamentos cancelados'}.`
              : `Bloqueio salvo (${when}).`,
          )
        })
      }
      onRemoveException={(item) => attempt(() => removeException.mutateAsync(item))}
    />
  )
}
