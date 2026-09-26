import { Clock, MapPin, Star } from 'lucide-react'
import { distanceFormat, ratingFormat } from '../../components/card-establishment/consts'

import type { BusinessDetailScreenProps } from './types'
import { MOCK_BUSINESSES } from './mock'
import { NotFoundScreen } from '../not-found'
import { ServiceCard } from '../../components/service-card'
import { TabBar } from '../../components/tab-bar'
import { VerifiedBadge } from '../../components/card-establishment/components/VerifiedBadge'

const comingSoon = <p className="type-body text-(--text-muted)">Em breve.</p>

/**
 * Tela 03 · Página do estabelecimento (Figma, 390px).
 */
export const BusinessDetailScreen = (props: BusinessDetailScreenProps) => {
  const { businessId, onBookService } = props

  const business = MOCK_BUSINESSES[businessId]

  if (!business) {
    return <NotFoundScreen />
  }

  const { name, rating, reviewCount, verified, street, neighborhood, distanceKm, openUntil } =
    business

  return (
    <div className="min-h-dvh bg-(--bg-page) pb-[env(safe-area-inset-bottom)]">
      {business.coverUrl ? (
        <img src={business.coverUrl} alt={`Foto de ${name}`} className="h-45 w-full object-cover" />
      ) : (
        <div aria-hidden="true" className="h-45 w-full bg-(--bg-disabled)" />
      )}

      <header className="flex flex-col items-start gap-(--space-8) bg-(--bg-surface) p-(--space-16)">
        <h1 className="type-title text-(--text-strong)">{name}</h1>

        <div className="flex items-center gap-(--space-8)">
          <p className="type-caption tabular flex items-center gap-(--space-8) text-(--text-muted)">
            <Star aria-hidden="true" className="size-4" />
            <span>
              <span className="sr-only">Nota </span>
              {ratingFormat.format(rating)} ({reviewCount})
            </span>
          </p>
          {verified && <VerifiedBadge />}
        </div>

        <p className="type-caption flex items-center gap-(--space-8) text-(--text-muted)">
          <MapPin aria-hidden="true" className="size-4 shrink-0" />
          <span>
            {street} — {neighborhood} · {distanceFormat.format(distanceKm)} km
          </span>
        </p>

        {openUntil && (
          <p className="type-caption flex items-center gap-(--space-8) rounded-(--radius-full) border border-(--status-confirmed-fg) bg-(--status-confirmed-bg) py-(--space-4) pr-(--space-12) pl-(--space-8) text-(--status-confirmed-fg)">
            <Clock aria-hidden="true" className="size-4 shrink-0" />
            Aberto hoje até {openUntil}
          </p>
        )}
      </header>

      <main>
        <TabBar
          label="Seções do estabelecimento"
          panelClassName="p-(--space-16)"
          items={[
            {
              id: 'services',
              label: 'Serviços',
              content: (
                <ul className="flex flex-col gap-(--space-12)">
                  {business.services.map(({ id, ...service }) => (
                    <li key={id}>
                      <ServiceCard {...service} onBook={() => onBookService?.(id)} />
                    </li>
                  ))}
                </ul>
              ),
            },
            // TODO: Profissionais e Avaliações não têm wireframe ainda.
            { id: 'professionals', label: 'Profissionais', content: comingSoon },
            { id: 'reviews', label: 'Avaliações', content: comingSoon },
          ]}
        />
      </main>
    </div>
  )
}
