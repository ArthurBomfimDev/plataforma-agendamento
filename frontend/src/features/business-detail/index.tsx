import { Clock, MapPin, Star } from 'lucide-react'
import {
  MOCK_CONFIRMATION_HOURS,
  MOCK_TODAY,
  getMockDayInfo,
  getMockDaySlots,
} from '../availability/mock'
import { distanceFormat, ratingFormat } from '../../components/card-establishment/consts'

import type { BusinessDetailScreenProps } from './types'
import { Button } from '../../components/button'
import { MOCK_BUSINESSES } from './mock'
import { NotFoundScreen } from '../not-found'
import { PageContainer } from '../../components/page-container'
import { ServiceCard } from '../../components/service-card'
import { TabBar } from '../../components/tab-bar'
import { TimeSlotChip } from '../../components/time-slot-chip'
import { VerifiedBadge } from '../../components/card-establishment/components/VerifiedBadge'
import { addDays } from 'date-fns'
import { useRef } from 'react'

const comingSoon = <p className="type-body text-(--text-muted)">Em breve.</p>

/** Quantos horários livres o card "Agendar agora" do desktop mostra. */
const NEXT_SLOTS_SHOWN = 3

/** Primeiros horários livres a partir de hoje (dado provisório da disponibilidade). */
const nextFreeSlots = () => {
  for (let day = MOCK_TODAY, i = 0; i < 60; day = addDays(day, 1), i++) {
    if (getMockDayInfo(day, MOCK_TODAY).status !== 'available') continue
    return Object.values(getMockDaySlots(day, MOCK_TODAY) ?? {})
      .flat()
      .filter(({ unavailable }) => !unavailable)
      .slice(0, NEXT_SLOTS_SHOWN)
      .map(({ time }) => time)
  }
  return []
}

/**
 * Tela 03 · Página do estabelecimento (Figma, 390px; desktop: 03D, 1440px).
 */
export const BusinessDetailScreen = (props: BusinessDetailScreenProps) => {
  const { businessId, onBookService } = props

  const servicesRef = useRef<HTMLUListElement>(null)

  const business = MOCK_BUSINESSES[businessId]

  if (!business) {
    return <NotFoundScreen />
  }

  const { name, rating, reviewCount, verified, street, neighborhood, distanceKm, openUntil } =
    business

  // O horário depende do serviço (duração), então "Agendar agora" leva à escolha do serviço.
  // TODO(figma): o 03D não diz o que tocar num horário do card faz; aqui também leva aos serviços.
  const goToServices = () => {
    servicesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    servicesRef.current?.querySelector('button')?.focus({ preventScroll: true })
  }

  const openUntilChip = (className: string) =>
    openUntil && (
      <p
        className={`type-caption flex items-center gap-(--space-8) rounded-(--radius-full) border border-(--status-confirmed-fg) bg-(--status-confirmed-bg) py-(--space-4) pr-(--space-12) pl-(--space-8) text-(--status-confirmed-fg) lg:py-(--space-2) ${className}`}
      >
        <Clock aria-hidden="true" className="size-4 shrink-0" />
        Aberto hoje até {openUntil}
      </p>
    )

  const photo = (className: string) =>
    business.coverUrl ? (
      <img
        src={business.coverUrl}
        alt={`Foto de ${name}`}
        className={`object-cover ${className}`}
      />
    ) : (
      <div aria-hidden="true" className={`bg-(--bg-disabled) ${className}`} />
    )

  return (
    <div className="min-h-dvh bg-(--bg-page) pb-[env(safe-area-inset-bottom)] lg:pb-(--space-40)">
      <PageContainer className="lg:flex lg:flex-col lg:gap-(--space-24) lg:pt-(--space-32)">
        {/* Celular: uma foto de capa. Desktop: galeria com a principal e duas menores. */}
        <div className="md:px-(--space-16) md:pt-(--space-16) lg:flex lg:h-65 lg:gap-(--space-8) lg:p-0">
          {photo('h-45 w-full md:rounded-lg lg:h-full lg:min-w-0 lg:flex-1')}
          {/* TODO: a galeria ainda não tem fotos no dado; as menores são o placeholder do 03D. */}
          <div aria-hidden="true" className="hidden w-75 shrink-0 flex-col gap-(--space-8) lg:flex">
            <div className="flex-1 rounded-lg bg-(--bg-disabled)" />
            <div className="flex-1 rounded-lg bg-(--bg-disabled)" />
          </div>
        </div>

        <div className="lg:flex lg:items-start lg:gap-(--space-24)">
          <div className="lg:flex lg:min-w-0 lg:flex-1 lg:flex-col lg:gap-(--space-20)">
            <header className="flex flex-col items-start gap-(--space-8) bg-(--bg-surface) p-(--space-16) md:bg-transparent lg:gap-(--space-20) lg:p-0">
              <h1 className="type-title text-(--text-strong) lg:text-(length:--size-display)! lg:leading-(--line-height-display)!">
                {name}
              </h1>

              <div className="flex flex-wrap items-center gap-(--space-8) lg:gap-(--space-12)">
                <p className="type-caption tabular flex items-center gap-(--space-8) text-(--text-muted) lg:text-(length:--size-label)! lg:leading-(--line-height-label)! lg:font-medium! lg:text-(--text-body)">
                  <Star aria-hidden="true" className="size-4" />
                  <span>
                    <span className="sr-only">Nota </span>
                    {ratingFormat.format(rating)} ({reviewCount})
                  </span>
                </p>
                {verified && <VerifiedBadge />}
                {openUntilChip('hidden lg:flex')}
              </div>

              <p className="type-caption flex items-center gap-(--space-8) text-(--text-muted) lg:text-(length:--size-label)! lg:leading-(--line-height-label)! lg:font-medium!">
                <MapPin aria-hidden="true" className="size-4 shrink-0" />
                <span>
                  {street} — {neighborhood} · {distanceFormat.format(distanceKm)} km
                </span>
              </p>

              {openUntilChip('lg:hidden')}
            </header>

            <main>
              <TabBar
                label="Seções do estabelecimento"
                listClassName="md:bg-transparent lg:gap-(--space-32) lg:px-0"
                panelClassName="p-(--space-16) lg:px-0 lg:pt-(--space-20) lg:pb-0"
                items={[
                  {
                    id: 'services',
                    label: 'Serviços',
                    content: (
                      <ul
                        ref={servicesRef}
                        className="flex scroll-mt-(--space-24) flex-col gap-(--space-12) lg:gap-(--space-16)"
                      >
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

          {/* Desktop: card fixo ao rolar, com os próximos horários (03D). */}
          <aside
            aria-labelledby="business-book-now"
            className="hidden w-85 shrink-0 flex-col gap-(--space-16) rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-(--space-20) lg:sticky lg:top-(--space-24) lg:flex"
          >
            <h2 id="business-book-now" className="type-heading text-(--text-strong)">
              Agendar agora
            </h2>
            <p className="type-caption text-(--text-muted)">Próximos horários livres</p>
            <ul className="grid grid-cols-3 gap-(--space-8)">
              {nextFreeSlots().map((time) => (
                <li key={time}>
                  <TimeSlotChip
                    time={time}
                    aria-label={`${time}: escolher o serviço`}
                    onClick={goToServices}
                    className="w-full px-(--space-8)"
                  />
                </li>
              ))}
            </ul>
            <p className="type-caption flex items-center gap-(--space-8) rounded-md border border-(--border-interactive) bg-(--bg-accent-soft) px-(--space-12) py-(--space-8) text-(--text-body)">
              <Clock aria-hidden="true" className="size-4 shrink-0" />
              <span>O estabelecimento confirma em até {MOCK_CONFIRMATION_HOURS} h.</span>
            </p>
            <Button size="lg" className="w-full" onClick={goToServices}>
              Escolher serviço
            </Button>
          </aside>
        </div>
      </PageContainer>
    </div>
  )
}
