import { ErrorScreen, LoadingScreen } from '@components/screen-state'
import { priceFormat } from '@components/service-card/consts'

import { Button } from '@components/button'
import { PageContainer } from '@components/page-container'
import { ProfessionalAvatar } from '@components/professional-avatar'
import { RatingLabel } from '@components/rating-label'
import { RequestProfileRemoval } from '@components/request-profile-removal'
import { ReviewsSection } from '@components/reviews-section'
import { ServiceIcon } from '@components/image-defaults/service-icon'
import { SmartImage } from '@components/smart-image'
import type { ProfessionalPageScreenProps } from './types'

/**
 * Página pública do profissional (ADR-031): foto ou iniciais, nome, especialidade, apresentação, os serviços dele com o
 * preço e a duração dele, os próximos horários livres de hoje e amanhã, o estabelecimento e o pedido de remoção. Só
 * profissional ativo aparece (senão a rota responde 404). Em Saúde, o registro profissional aparece discreto, se informado.
 */
export const ProfessionalPageScreen = (props: ProfessionalPageScreenProps) => {
  const { data, onBook, onOpenBusiness, onRequestRemoval, reviews } = props

  if (data.status === 'loading') return <LoadingScreen label="Carregando o perfil…" />
  if (data.status === 'error') return <ErrorScreen message={data.message} onRetry={data.onRetry} />

  const { professional } = data
  const firstName = professional.name.split(' ')[0] ?? professional.name
  const hasSlots = professional.nextSlots.some(({ times }) => times.length > 0)

  return (
    <PageContainer>
      <main className="flex flex-col gap-(--space-24) pb-(--space-40)">
        <header className="flex items-center gap-(--space-16)">
          <ProfessionalAvatar name={professional.name} photo={professional.photo} size="xl" />
          <div className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
            <h1 className="type-title text-(--text-strong)">{professional.name}</h1>
            {professional.specialty && (
              <p className="type-body text-(--text-muted)">{professional.specialty}</p>
            )}
            {professional.registration && (
              <p className="type-caption text-(--text-muted)">
                Registro profissional: {professional.registration}
              </p>
            )}
            {professional.rating && (
              <RatingLabel
                average={professional.rating.average}
                count={professional.rating.count}
              />
            )}
          </div>
        </header>

        {professional.bio && (
          <section aria-labelledby="professional-about" className="flex flex-col gap-(--space-8)">
            <h2 id="professional-about" className="type-label text-(--text-strong)">
              Sobre
            </h2>
            <p className="type-body whitespace-pre-line text-(--text-body)">{professional.bio}</p>
          </section>
        )}

        <Button
          size="lg"
          className="w-full sm:w-auto sm:self-start"
          onClick={() => onBook?.()}
          disabled={professional.services.length === 0}
        >
          Agendar com {firstName}
        </Button>

        <section aria-labelledby="professional-services" className="flex flex-col gap-(--space-12)">
          <h2 id="professional-services" className="type-label text-(--text-strong)">
            Serviços
          </h2>
          {professional.services.length === 0 ? (
            <p role="status" className="type-body text-(--text-muted)">
              {firstName} ainda não tem serviços para agendar.
            </p>
          ) : (
            <ul className="flex flex-col gap-(--space-8)">
              {professional.services.map((service) => (
                <li
                  key={service.id}
                  className="flex items-center gap-(--space-12) rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-(--space-12)"
                >
                  <SmartImage
                    image={service.photo}
                    alt=""
                    sizes="48px"
                    width={48}
                    height={48}
                    className="size-12 shrink-0 rounded-md"
                    fallback={
                      <ServiceIcon category={professional.business.category} className="size-12" />
                    }
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
                    <p className="type-body truncate text-(--text-strong)">{service.name}</p>
                    <p className="type-caption tabular text-(--text-muted)">
                      {service.durationMinutes} min · {priceFormat.format(service.priceCents / 100)}
                    </p>
                  </div>
                  <Button
                    aria-label={`Agendar ${service.name} com ${firstName}`}
                    onClick={() => onBook?.(service.id)}
                  >
                    Agendar
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {professional.services.length > 0 && (
          <section aria-labelledby="professional-slots" className="flex flex-col gap-(--space-8)">
            <h2 id="professional-slots" className="type-label text-(--text-strong)">
              Próximos horários livres
            </h2>
            {hasSlots ? (
              professional.nextSlots.map(({ label, times }) => (
                <p key={label} className="type-body tabular text-(--text-body)">
                  <span className="text-(--text-muted)">{label}: </span>
                  {times.length > 0 ? times.join(' · ') : 'sem horário'}
                </p>
              ))
            ) : (
              <p role="status" className="type-body text-(--text-muted)">
                Nenhum horário livre hoje nem amanhã. Veja outras datas ao agendar.
              </p>
            )}
          </section>
        )}

        {reviews && (
          <ReviewsSection
            title={`Avaliações de ${firstName}`}
            summary={reviews.summary}
            list={reviews.list}
          />
        )}

        <section aria-labelledby="professional-business" className="flex flex-col gap-(--space-8)">
          <h2 id="professional-business" className="type-label text-(--text-strong)">
            Onde atende
          </h2>
          <p className="type-body text-(--text-strong)">{professional.business.name}</p>
          {professional.business.address && (
            <p className="type-caption text-(--text-muted)">{professional.business.address}</p>
          )}
          <Button
            variant="secondary"
            className="self-start"
            onClick={() => onOpenBusiness?.(professional.business.id)}
          >
            Ver o estabelecimento
          </Button>
        </section>

        {onRequestRemoval && <RequestProfileRemoval onSubmit={onRequestRemoval} />}
      </main>
    </PageContainer>
  )
}
