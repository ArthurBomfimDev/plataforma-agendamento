import type {
  ExceptionChoice,
  ExceptionDraft,
  ExceptionItem,
  Loadable,
  ScheduleDraft,
  ScheduleRow,
} from '@features/panel-schedules/types'
import {
  affectedLabel,
  exceptionPeriod,
  toExceptionItem,
  toScheduleRequest,
  toScheduleRow,
} from './manage-adapters'
import { usePanelExceptions, usePanelMutation, usePanelWorkSchedules } from '@lib/api/queries'

import { SchedulesScreen } from '@features/panel-schedules'
import { errorMessage } from '@lib/api/errors'
import { exceptionWhenLabel } from '@features/panel-schedules/consts'
import { manageApi } from '@lib/api/endpoints'
import { toast } from '@lib/toast'
import { usePanelContext } from './panel-context'
import { useState } from 'react'

/** Painel — Jornadas e bloqueios (Onda 7D). Só o dono (`RequireOwner`). */
export const PanelSchedulesRoute = () => {
  const { context, business, professionals, today } = usePanelContext()
  const [chosenId, setChosenId] = useState<string | null>(null)
  const selectedId = professionals.some(({ id }) => id === chosenId)
    ? chosenId
    : (professionals[0]?.id ?? null)

  const [schedulesQuery] = usePanelWorkSchedules(context.businessId, selectedId ? [selectedId] : [])
  const exceptionsQuery = usePanelExceptions(context.businessId)
  const { timeZone } = business

  const nameOf = (id: string) =>
    professionals.find((professional) => professional.id === id)?.displayName ?? 'Profissional'

  const saveSchedule = usePanelMutation(
    context.businessId,
    ({ rowId, draft }: { rowId: string | null; draft: ScheduleDraft }) =>
      rowId
        ? manageApi.updateWorkSchedule(rowId, toScheduleRequest(draft))
        : manageApi.addWorkSchedule(selectedId!, toScheduleRequest(draft)),
  )
  const removeSchedule = usePanelMutation(context.businessId, (row: ScheduleRow) =>
    manageApi.removeWorkSchedule(row.id),
  )
  const addException = usePanelMutation(
    context.businessId,
    ({ draft, choice }: { draft: ExceptionDraft; choice: ExceptionChoice }) =>
      manageApi.addException({
        professionalId: draft.professionalId,
        kind: draft.kind,
        ...exceptionPeriod(draft, timeZone),
        reason: draft.reason?.trim() || null,
        existingAppointments: choice.existingAppointments,
        cancellationReason: choice.cancellationReason,
      }),
  )
  const removeException = usePanelMutation(context.businessId, (item: ExceptionItem) =>
    manageApi.removeException(item.id),
  )

  const attempt = async (task: () => Promise<unknown>) => {
    try {
      await task()
      return null
    } catch (error) {
      return errorMessage(error)
    }
  }

  const schedules: Loadable<ScheduleRow> = !schedulesQuery
    ? { status: 'ready', items: [] }
    : schedulesQuery.isError
      ? {
          status: 'error',
          message: errorMessage(schedulesQuery.error),
          onRetry: () => void schedulesQuery.refetch(),
        }
      : schedulesQuery.data
        ? { status: 'ready', items: schedulesQuery.data.map(toScheduleRow) }
        : { status: 'loading' }

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
    <SchedulesScreen
      businessName={business.name}
      professionals={professionals.map(({ id, displayName }) => ({ id, name: displayName }))}
      selectedId={selectedId}
      onSelect={setChosenId}
      schedules={schedules}
      exceptions={exceptions}
      today={today}
      onSaveSchedule={(rowId, draft) => attempt(() => saveSchedule.mutateAsync({ rowId, draft }))}
      onRemoveSchedule={(row) => attempt(() => removeSchedule.mutateAsync(row))}
      onPreviewException={async (draft) => {
        try {
          const result = await manageApi.affectedAppointments({
            ...exceptionPeriod(draft, timeZone),
            professionalId: draft.professionalId,
          })
          return result.items.map((appointment) => ({
            id: appointment.id,
            label: affectedLabel(appointment, timeZone, nameOf),
          }))
        } catch (error) {
          return errorMessage(error)
        }
      }}
      onAddException={(draft, choice) =>
        attempt(async () => {
          const saved = await addException.mutateAsync({ draft, choice })
          const when = exceptionWhenLabel(toExceptionItem(saved, timeZone, nameOf))
          toast.success(
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
