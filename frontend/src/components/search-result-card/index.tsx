import { Card, CardContent } from '../ui/card'
import { Clock, Hourglass } from 'lucide-react'
import { NO_AVAILABILITY_MESSAGE, priceFormat, priceWholeFormat } from './consts'

import type { SearchResultCardProps } from './types'
import { TimeSlotChip } from '../time-slot-chip'
import { cn } from 'cn'
import { distanceFormat } from '../card-establishment/consts'

export const SearchResultCard = (props: SearchResultCardProps) => {
  const {
    name,
    serviceName,
    durationMinutes,
    priceCents,
    distanceKm,
    imageUrl,
    availability,
    onSelectSlot,
    className,
  } = props

  const price = priceCents % 100 === 0 ? priceWholeFormat : priceFormat

  return (
    <Card
      className={cn(
        'gap-0 rounded-lg border border-(--border-subtle) bg-(--bg-surface) shadow-(--elevation-card) ring-0 [--card-spacing:var(--space-16)]',
        className,
      )}
    >
      <CardContent className="flex flex-col gap-(--space-12)">
        <div className="flex items-start gap-(--space-12)">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`Foto de ${name}`}
              className="size-14 shrink-0 rounded-md object-cover"
            />
          ) : (
            <div aria-hidden="true" className="size-14 shrink-0 rounded-md bg-(--bg-disabled)" />
          )}

          <div className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
            <h2 className="type-body truncate text-(--text-strong)">{name}</h2>
            <p className="type-caption truncate text-(--text-muted)">
              {serviceName} · {durationMinutes} min
            </p>
            <p className="type-caption tabular truncate text-(--text-body)">
              {price.format(priceCents / 100)} · {distanceFormat.format(distanceKm)} km
            </p>
          </div>
        </div>

        {availability ? (
          <>
            <p className="type-caption flex items-center gap-(--space-8) text-(--text-muted)">
              <Clock aria-hidden="true" className="size-4 shrink-0" />
              {availability.dayLabel}
            </p>
            <ul className="flex flex-wrap gap-(--space-8)">
              {availability.slots.map((slot) => (
                <li key={slot}>
                  <TimeSlotChip
                    time={slot}
                    aria-label={`${availability.dayLabel}, ${slot}, ${name}`}
                    onClick={() => onSelectSlot?.(slot)}
                  />
                </li>
              ))}
            </ul>
          </>
        ) : (
          // Estado "expirado": além da cor, o ícone de ampulheta e o texto carregam o significado.
          <p className="type-caption flex items-center gap-(--space-8) rounded-md border border-l-3 border-(--status-expired-fg) bg-(--status-expired-bg) px-(--space-12) py-(--space-8) text-(--status-expired-fg)">
            <Hourglass aria-hidden="true" className="size-4 shrink-0" />
            {NO_AVAILABILITY_MESSAGE}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
