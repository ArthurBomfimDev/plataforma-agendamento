import type { ReactNode } from 'react'
import { cn } from 'cn'

export const cardTitle = (
  icon: ReactNode,
  title: string,
  className: string,
  trailing?: ReactNode,
) => (
  <div className="flex flex-wrap items-center gap-x-(--space-8) gap-y-(--space-4)">
    {icon}
    <p className={cn('type-body min-w-0 flex-1 basis-32 wrap-break-word', className)}>{title}</p>
    {trailing}
  </div>
)
