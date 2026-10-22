import { Badge } from '@components/ui/badge'
import { STATUS } from './consts'
import type { StatusChipProps } from './types'
import { cn } from 'cn'

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
