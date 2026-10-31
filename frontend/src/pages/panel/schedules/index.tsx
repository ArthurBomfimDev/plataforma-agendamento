import type {
  ExceptionChoice,
  ExceptionDraft,
  ExceptionItem,
  Loadable,
  ScheduleProfessional,
  ScheduledChange,
  WeekSchedule,
} from './screen/types'
import {
  exceptionPeriod,
  scheduledChanges,
  toExceptionItem,
  toScheduleRequest,
  toAffectedItem,
  toScheduleRow,
  toWeekSchedule,
  weekChanges,
} from '../manage-adapters'
import { exceptionWhenLabel, holidaysFrom } from './screen/consts'
import { usePanelMutation, usePanelWorkSchedules } from '@api/services/panel/hooks'

import { WorkScheduleScreen } from './screen'
import { errorMessage } from '@api/base'
import { managementService } from '@api/services/management'
import { notify } from '@components/toaster/notify'
import { usePanelContext } from '@layouts/panel-layout/context'
import { usePanelExceptions } from '@api/services/management/hooks'

/** Uma gravação que resolve `null` se deu certo, senão a mensagem em português. */
const attempt = async (task: () => Promise<unknown>) => {
  try {
    await task()
    return null
  } catch (error) {
    return errorMessage(error)
  }
}

/** Painel — Jornada e bloqueios (Onda 7D, tela 12). Só o dono (`RequireOwner`). */
export const PanelSchedulesRoute = () => {
  const { context, business, professionals, today } = usePanelContext()
  const { timeZone } = business
  const ids = professionals.map(({ id }) => id)

  const schedulesQueries = usePanelWorkSchedules(context.businessId, ids)
  const exceptionsQuery = usePanelExceptions(context.businessId)

  const nameOf = (id: string) =>
    professionals.find((professional) => professional.id === id)?.displayName ?? 'Profissional'
  const rowsOf = (professionalId: string) =>
    schedulesQueries[ids.indexOf(professionalId)]?.data?.map(toScheduleRow) ?? []

  const saveWeek = usePanelMutation(
    context.businessId,
    async ({
      professionalId,
      schedule,
      from,
    }: {
      professionalId: string
      schedule: WeekSchedule
      from: string
    }) => {
      const { close, remove, add } = weekChanges(rowsOf(professionalId), schedule, from)
      // Encerrar e apagar antes de criar: a API recusa faixas que se cruzam (`work_schedule.overlaps`).
      for (const row of close)
        await managementService.updateWorkSchedule(row.id, toScheduleRequest(row))
      for (const row of remove) await managementService.removeWorkSchedule(row.id)
      for (const draft of add)
        await managementService.addWorkSchedule(professionalId, toScheduleRequest(draft))
    },
  )
  const removeChange = usePanelMutation(context.businessId, (change: ScheduledChange) =>
    managementService.removeWorkSchedule(change.id),
  )
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

  const failing = schedulesQueries.find((query) => query.isError)
  const team: Loadable<ScheduleProfessional> = failing
    ? {
        status: 'error',
        message: errorMessage(failing.error),
        onRetry: () => schedulesQueries.forEach((query) => query.isError && void query.refetch()),
      }
    : schedulesQueries.some((query) => !query.data)
      ? { status: 'loading' }
      : {
          status: 'ready',
          items: professionals.map(({ id, displayName }) => {
            const rows = rowsOf(id)
            return {
              id,
              name: displayName,
              schedule: toWeekSchedule(rows, today),
              changes: scheduledChanges(rows, today),
            }
          }),
        }

  const exceptions: Loadable<ExceptionItem> = exceptionsQuery.isError
    ? {
        status: 'error',
        message: errorMessage(exceptionsQuery.error),
        onRetry: () => void exceptionsQuery.refetch(),
      }
    : exceptionsQuery.data
      ? {
          status: 'ready',
          items: exceptionsQuery.data.map((exception) =>
            toExceptionItem(exception, timeZone, nameOf),
          ),
        }
      : { status: 'loading' }

  return (
    <WorkScheduleScreen
      professionals={team}
      exceptions={exceptions}
      holidays={holidaysFrom(today)}
      initialHolidayRules={{}}
      today={today}
      onSaveSchedule={(professionalId, schedule, from) =>
        attempt(() => saveWeek.mutateAsync({ professionalId, schedule, from }))
      }
      onRemoveChange={(change) => attempt(() => removeChange.mutateAsync(change))}
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
