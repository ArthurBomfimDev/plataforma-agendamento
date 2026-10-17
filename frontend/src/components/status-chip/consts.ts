import { Ban, Check, CheckCheck, Clock, type LucideIcon } from 'lucide-react'
import type { AppointmentStatus } from './types'

/**
 * Cada estado tem canal além da cor (Figma, "Chip de status"): Pending = borda tracejada + relógio
 * (o único tracejado do sistema, "provisório"); Confirmed = preenchido + check; Completed = sem
 * borda + check duplo; Cancelled = preenchido + barra.
 */
export const STATUS: Record<
  AppointmentStatus,
  { label: string; icon: LucideIcon; className: string }
> = {
  pending: {
    label: 'Pendente',
    icon: Clock,
    className:
      'border-dashed border-(--status-pending-fg) bg-(--status-pending-bg) text-(--status-pending-fg)',
  },
  confirmed: {
    label: 'Confirmado',
    icon: Check,
    className:
      'border-(--status-confirmed-fg) bg-(--status-confirmed-bg) text-(--status-confirmed-fg)',
  },
  completed: {
    label: 'Concluído',
    icon: CheckCheck,
    className: 'border-transparent bg-(--status-completed-bg) text-(--status-completed-fg)',
  },
  // TODO(figma): o Cancelled não aparece em nenhuma tela; segue só a descrição do componente.
  cancelled: {
    label: 'Cancelado',
    icon: Ban,
    className: 'border-transparent bg-(--status-cancelled-bg) text-(--status-cancelled-fg)',
  },
}
