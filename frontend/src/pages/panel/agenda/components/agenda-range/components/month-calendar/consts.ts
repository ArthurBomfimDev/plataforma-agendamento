import type { AppointmentStatus } from '@components/status-chip/types'
import { ENTRY_CLASSES } from '@pages/panel/agenda/screen/components/day-grid/consts'

/** Quantos agendamentos cabem numa célula do desktop antes do "+N mais". */
export const VISIBLE_PER_DAY = 3

/** As mesmas cores dos blocos da grade do dia: o status tem a mesma cara nas três visões. */
export const ITEM_CLASSES: Record<AppointmentStatus, string> = {
  confirmed: ENTRY_CLASSES.confirmed,
  pending: ENTRY_CLASSES.pending,
  completed: ENTRY_CLASSES.completed,
  'no-show': ENTRY_CLASSES['no-show'],
  cancelled: ENTRY_CLASSES.block,
}
