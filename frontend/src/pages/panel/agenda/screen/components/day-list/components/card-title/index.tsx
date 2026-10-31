import type { ReactNode } from 'react'
import { cn } from 'cn'

export const cardTitle = (
  icon: ReactNode,
  title: string,
  className: string,
  trailing?: ReactNode,
) => (
  <div className="flex items-center gap-(--space-8)">
    {icon}
    <p className={cn('type-body min-w-0 flex-1', className)}>{title}</p>
    {trailing}
  </div>
)
