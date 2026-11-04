import { TIME_COLUMN } from './consts'
import { cn } from 'cn'

export const timeColumn = (start: string, duration?: string, muted = false) => (
  <div className={TIME_COLUMN}>
    <p
      className={cn('type-label tabular', muted ? 'text-(--text-disabled)' : 'text-(--text-body)')}
    >
      {start}
    </p>
    {duration && <p className="type-caption tabular text-(--text-muted)">{duration}</p>}
  </div>
)
