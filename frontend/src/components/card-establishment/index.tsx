import { Card, CardContent } from '../ui/card'
import { MapPin, Star } from 'lucide-react'
import { distanceFormat, ratingFormat } from './consts'

import { CardEstablishmentImage } from './components/CardEstablishmentImage'
import type { CardEstablishmentProps } from './types'
import { VerifiedBadge } from './components/VerifiedBadge'
import { cn } from 'cn'

export const CardEstablishment = (props: CardEstablishmentProps) => {
  const { name, rating, reviewCount, distanceKm, neighborhood, verified, imageUrl, className } =
    props

  return (
    <Card
      className={cn(
        'gap-0 rounded-lg border border-(--border-subtle) bg-(--bg-surface) shadow-(--elevation-card) ring-0 [--card-spacing:var(--space-16)]',
        className,
      )}
    >
      <CardContent className="flex flex-col gap-(--space-8)">
        <CardEstablishmentImage src={imageUrl} alt={`Foto de ${name}`} />

        <div className="flex items-center gap-(--space-8)">
          <h3 className="type-heading min-w-0 flex-1 text-(--text-strong)">{name}</h3>
          {verified && <VerifiedBadge />}
        </div>

        <p className="type-caption tabular flex items-center gap-(--space-8) text-(--text-muted)">
          <Star aria-hidden="true" className="size-4" />
          <span>
            <span className="sr-only">Nota </span>
            {ratingFormat.format(rating)} ({reviewCount})
          </span>
          <MapPin aria-hidden="true" className="size-4" />
          <span>
            {distanceFormat.format(distanceKm)} km · {neighborhood}
          </span>
        </p>
      </CardContent>
    </Card>
  )
}
