import { Card, CardContent } from '@components/ui/card'
import { HourglassIcon, ScheduleIcon } from '@assets/icons'
import { NO_AVAILABILITY_MESSAGE, priceFormat, priceWholeFormat } from './consts'

import { BusinessIllustration } from '@components/image-defaults/business-illustration'
import type { SearchResultCardProps } from './types'
import { SmartImage } from '@components/smart-image'
import { TimeSlotChip } from '@components/time-slot-chip'
import { cn } from 'cn'
import { distanceFormat } from '@components/card-establishment/consts'

export const SearchResultCard = (props: SearchResultCardProps) => {
  const {
    name,
    serviceName,
    durationMinutes,
    priceCents,
    distanceKm,
    image,
    category,
    availability,
    priceFrom,
    onSelectSlot,
    onOpen,
    className,
  } = props

  const price = priceCents % 100 === 0 ? priceWholeFormat : priceFormat

  return (
    <Card
      className={cn(
        'gap-0 rounded-lg border border-(--border-subtle) bg-(--bg-surface) shadow-(--elevation-card) ring-0 [--card-spacing:var(--space-16)]',
        onOpen &&
          'relative cursor-pointer has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-(--border-focus)',
        className,
      )}
    >
      <CardContent className="flex flex-col gap-(--space-12)">
        <div className="flex items-start gap-(--space-12)">
          {/* Logotipo (ou a capa); sem imagem, a ilustração da categoria. Decorativa: o nome está ao lado. */}
          <SmartImage
            image={image}
            alt=""
            sizes="56px"
            width={1}
            height={1}
            fallback={<BusinessIllustration category={category ?? 'Beleza'} />}
            className="size-14 shrink-0 rounded-md"
          />

          <div className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
            <h2 className="type-body truncate text-(--text-strong)">
              {onOpen ? (
                <button
                  type="button"
                  onClick={onOpen}
                  className="text-left outline-none after:absolute after:inset-0 after:content-['']"
                >
                  {name}
                </button>
              ) : (
                name
              )}
            </h2>
            <p className="type-caption truncate text-(--text-muted)">
              {serviceName} · {durationMinutes} min
            </p>
            <p className="type-caption tabular truncate text-(--text-body)">
              {priceFrom && 'a partir de '}
              {price.format(priceCents / 100)} · {distanceFormat.format(distanceKm)} km
            </p>
          </div>
        </div>

        {availability === undefined ? null : availability ? (
          <>
            <p className="type-caption flex items-center gap-(--space-8) text-(--text-muted)">
              <ScheduleIcon aria-hidden="true" className="size-4 shrink-0" />
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
            <HourglassIcon aria-hidden="true" className="size-4 shrink-0" />
            {NO_AVAILABILITY_MESSAGE}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
