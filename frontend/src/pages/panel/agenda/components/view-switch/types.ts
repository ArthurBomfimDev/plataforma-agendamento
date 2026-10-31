import type { AgendaView } from '@pages/panel/agenda/filters'

export type ViewSwitchProps = {
  value: AgendaView
  onValueChange: (view: AgendaView) => void
  className?: string
}
