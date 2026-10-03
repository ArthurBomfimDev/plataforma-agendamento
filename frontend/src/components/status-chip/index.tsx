import type { AppointmentStatus, StatusChipProps } from './types'

import { Badge } from '../ui/badge'
import { Ban, Check, CheckCheck, Clock } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from 'cn'

/**
 * Cada estado tem canal além da cor (Figma, "Chip de status"): Pending = borda tracejada + relógio
 * (o único tracejado do sistema, "provisório"); Confirmed = preenchido + check; Completed = sem
 * borda + check duplo; Cancelled = preenchido + barra.
 */
const STATUS: Record<AppointmentStatus, { label: string; icon: LucideIcon; className: string }> = {
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

/** Chip de status do Figma, construído sobre o Badge do shadcn (Base UI). */
export const StatusChip = (props: StatusChipProps) => {
  const { status, className } = props
  const { label, icon: Icon, className: statusClassName } = STATUS[status]

  return (
    <Badge
      className={cn(
        'type-label h-auto gap-(--space-4) rounded-(--radius-full) border py-(--space-4) pr-(--space-12) pl-(--space-8) [&>svg]:size-4!',
        statusClassName,
        className,
      )}
    >
      <Icon aria-hidden="true" />
      {label}
    </Badge>
  )
}
