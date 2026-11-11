import { LocationIcon, ScheduleIcon } from '@assets/icons'

import { distanceFormat } from '@components/card-establishment/consts'
import { RatingLabel } from '@components/rating-label'
import { ReviewsSection } from '@components/reviews-section'

import type { BusinessDetailScreenProps } from './types'
import { Button } from '@components/button'
import { ReportBusiness } from '@components/report-business'
import { ServiceIcon } from '@components/image-defaults/service-icon'
import { ShowcaseGallery } from '@components/showcase-gallery'
import { SmartImage } from '@components/smart-image'
import { PageContainer } from '@components/page-container'
import { ServiceCard } from '@components/service-card'
import { TabBar } from '@components/tab-bar'
import { TimeSlotChip } from '@components/time-slot-chip'
import { VerifiedBadge } from '@components/card-establishment/components/verified-badge'
import { ProfessionalsList } from './components/professionals-list'
import { useRef } from 'react'
const comingSoon = <p className="type-body text-(--text-muted)">Em breve.</p>

/**
 * Tela 03 · Página do estabelecimento (Figma, 390px; desktop: 03D, 1440px).
 */
export const BusinessDetailScreen = (props: BusinessDetailScreenProps) => {
  const {
    business,
    nextFreeSlots = [],
    onBookService,
    onReport,
    professionals,
    onOpenProfessional,
    reviews,
  } = props

  const servicesRef = useRef<HTMLUListElement>(null)

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
        <ScheduleIcon aria-hidden="true" className="size-4 shrink-0" />
        Aberto hoje até {openUntil}
      </p>
    )

  return (
    <div className="min-h-dvh bg-(--bg-page) pb-[env(safe-area-inset-bottom)] lg:pb-(--space-40)">
      <PageContainer className="lg:flex lg:flex-col lg:gap-(--space-24) lg:pt-(--space-32)">
        {/* Vitrine: até 3 fotos. Celular: faixa que rola; desktop: a principal e as outras ao lado. */}
        <div className="md:px-(--space-16) md:pt-(--space-16) lg:p-0">
          <ShowcaseGallery
            name={name}
            category={business.category}
            photos={business.photos}
            cover={business.cover}
          />
        </div>

        <div className="lg:flex lg:items-start lg:gap-(--space-24)">
          <div className="lg:flex lg:min-w-0 lg:flex-1 lg:flex-col lg:gap-(--space-20)">
            <header className="flex flex-col items-start gap-(--space-8) bg-(--bg-surface) p-(--space-16) md:bg-transparent lg:gap-(--space-20) lg:p-0">
              <div className="flex items-center gap-(--space-12)">
                {business.logo && (
                  <SmartImage
                    image={business.logo}
                    alt=""
                    sizes="56px"
                    width={1}
                    height={1}
                    fallback={null}
                    className="size-12 shrink-0 rounded-md border border-(--border-subtle) bg-(--bg-surface) lg:size-14"
                  />
                )}
                <h1 className="type-title text-(--text-strong) lg:text-(length:--size-display)! lg:leading-(--line-height-display)!">
                  {name}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-(--space-8) lg:gap-(--space-12)">
                {/* Sem contagem = a nota ainda não foi lida (carregando ou erro): não afirma nada. */}
                {reviewCount !== undefined && (
                  <RatingLabel average={rating ?? null} count={reviewCount} />
                )}
                {verified && <VerifiedBadge />}
                {openUntilChip('hidden lg:flex')}
              </div>

              <p className="type-caption flex items-center gap-(--space-8) text-(--text-muted) lg:text-(length:--size-label)! lg:leading-(--line-height-label)! lg:font-medium!">
                <LocationIcon aria-hidden="true" className="size-4 shrink-0" />
                <span>
                  {street} — {neighborhood}
                  {distanceKm !== undefined && ` · ${distanceFormat.format(distanceKm)} km`}
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
                        {business.services.map(({ id, photo, ...service }) => (
                          <li key={id}>
                            <ServiceCard
                              {...service}
                              leading={
                                <SmartImage
                                  image={photo}
                                  alt=""
                                  sizes="48px"
                                  width={48}
                                  height={48}
                                  className="size-12 shrink-0 rounded-md"
                                  fallback={
                                    <ServiceIcon category={business.category} className="size-12" />
                                  }
                                />
                              }
                              onBook={() => onBookService?.(id)}
                            />
                          </li>
                        ))}
                      </ul>
                    ),
                  },
                  // TODO: Profissionais e Avaliações não têm wireframe ainda.
                  {
                    id: 'professionals',
                    label: 'Profissionais',
                    content: (
                      <ProfessionalsList
                        professionals={professionals}
                        onOpen={(id) => onOpenProfessional?.(id)}
                      />
                    ),
                  },
                  {
                    id: 'reviews',
                    label: 'Avaliações',
                    content: reviews ? (
                      <ReviewsSection
                        title="Avaliações"
                        summary={reviews.summary}
                        list={reviews.list}
                      />
                    ) : (
                      comingSoon
                    ),
                  },
                ]}
              />
            </main>
            {onReport && <ReportBusiness onSubmit={onReport} />}
          </div>

          {/* Desktop: card fixo ao rolar, com os próximos horários (03D). */}
          <aside
            aria-labelledby="business-book-now"
            className="hidden w-85 shrink-0 flex-col gap-(--space-16) rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-(--space-20) lg:sticky lg:top-(--space-24) lg:flex"
          >
            <h2 id="business-book-now" className="type-heading text-(--text-strong)">
              Agendar agora
            </h2>
            {nextFreeSlots.length > 0 && (
              <p className="type-caption text-(--text-muted)">Próximos horários livres</p>
            )}
            <ul className="grid grid-cols-3 gap-(--space-8)">
              {nextFreeSlots.map((time) => (
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
              <ScheduleIcon aria-hidden="true" className="size-4 shrink-0" />
              <span>O estabelecimento confirma em até {business.confirmationHours} h.</span>
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
