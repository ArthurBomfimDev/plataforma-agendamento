import { Card, CardContent } from '../ui/card'

import { Button } from '../button'
import { Clock } from 'lucide-react'
import type { ServiceCardProps } from './types'
import { cn } from 'cn'
import { priceFormat } from './consts'

export const ServiceCard = (props: ServiceCardProps) => {
  const { name, durationMinutes, priceCents, onBook, className } = props

  return (
    <Card
      className={cn(
        'gap-0 rounded-lg border border-(--border-subtle) bg-(--bg-surface) shadow-(--elevation-card) ring-0 [--card-spacing:var(--space-16)]',
        className,
      )}
    >
      <CardContent className="flex items-center gap-(--space-12) lg:gap-(--space-16) lg:px-(--space-20)">
        <div className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
          <h3 className="type-body truncate text-(--text-strong)">{name}</h3>
          <p className="type-caption tabular flex items-center gap-(--space-8) text-(--text-muted)">
            <Clock aria-hidden="true" className="size-4 shrink-0" />
            <span>{durationMinutes} min</span>
            {/* No desktop o preço sai da linha e vira destaque ao lado do botão. */}
            <span aria-hidden="true" className="lg:hidden">
              ·
            </span>
            <span className="text-(--text-body) lg:hidden">
              {priceFormat.format(priceCents / 100)}
            </span>
          </p>
        </div>
        <p className="type-heading tabular hidden shrink-0 text-(--text-strong) lg:block">
          {priceFormat.format(priceCents / 100)}
        </p>
        <Button aria-label={`Agendar ${name}`} onClick={onBook}>
          Agendar
        </Button>
      </CardContent>
    </Card>
  )
}
