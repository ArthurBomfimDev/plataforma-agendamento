import { Check, ChevronLeft, Star } from 'lucide-react'

import { Avatar } from '@components/avatar'
import { Breadcrumb } from '@components/breadcrumb'
import { Button } from '@components/button'
import type { ChooseProfessionalScreenProps } from './types'
import { MOCK_BUSINESSES } from '@features/business-detail/mock'
import { MOCK_PROFESSIONALS } from './mock'
import { NotFoundScreen } from '@features/not-found'
import { PageContainer } from '@components/page-container'
import { ProfessionalOption } from '@components/professional-option'
import { priceFormat } from '@components/service-card/consts'
import { ratingFormat } from '@components/card-establishment/consts'

const yearsLabel = (years: number) => `${years} ${years === 1 ? 'ano' : 'anos'}`

const divider = <hr aria-hidden="true" className="h-px w-full border-0 bg-(--border-subtle)" />

/**
 * Tela 04 · Escolher profissional (Figma, 390px; desktop: 04D, 1440px).
 *
 * Celular e desktop têm estruturas diferentes — lista com divisórias contra destaque + grade de
 * cards —, então cada uma é renderizada e escondida pelo breakpoint.
 */
export const ChooseProfessionalScreen = (props: ChooseProfessionalScreenProps) => {
  const { businessId, serviceId, onBack, onSelectProfessional } = props

  const business = MOCK_BUSINESSES[businessId]
  const service = business?.services.find(({ id }) => id === serviceId)

  if (!business || !service) {
    return <NotFoundScreen />
  }

  const professionals = MOCK_PROFESSIONALS[businessId] ?? []
  const serviceSummary = `${service.name} · ${service.durationMinutes} min · ${priceFormat.format(service.priceCents / 100)}`

  return (
    <div className="min-h-dvh bg-(--bg-surface) pb-[env(safe-area-inset-bottom)] lg:bg-(--bg-page)">
      <PageContainer>
        <header className="flex items-center gap-(--space-12) px-(--space-16) pt-[calc(var(--space-16)+env(safe-area-inset-top))] pb-(--space-8) lg:hidden">
          {/* Ícone de 20px, área de toque de 44px; a margem negativa mantém o alinhamento do Figma. */}
          <button
            type="button"
            aria-label="Voltar"
            onClick={onBack}
            className="-m-(--space-12) flex size-(--size-touch-min) shrink-0 items-center justify-center text-(--text-strong) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)"
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
          </button>
          <p className="type-caption tabular min-w-0 flex-1 text-(--text-muted)">
            {serviceSummary}
          </p>
        </header>

        <main className="flex flex-col gap-(--space-20) px-(--space-16) pt-(--space-12) pb-(--space-16) lg:gap-(--space-24) lg:px-0 lg:pt-(--space-32) lg:pb-(--space-40)">
          <Breadcrumb
            className="hidden lg:block"
            items={[{ label: business.name, onClick: onBack }, { label: serviceSummary }]}
          />

          <h1 className="type-title text-(--text-strong) lg:text-(length:--size-display)! lg:leading-(--line-height-display)!">
            Com quem você quer agendar?
          </h1>

          {/* Celular: lista com divisórias. */}
          <ul className="flex flex-col gap-(--space-2) lg:hidden">
            <li className="flex flex-col gap-(--space-2)">
              <ProfessionalOption
                leading={
                  <span
                    aria-hidden="true"
                    className="size-5.5 shrink-0 rounded-(--radius-full) bg-(--action-primary)"
                  />
                }
                title="Sem preferência"
                details={['Mostra mais horários disponíveis']}
                onSelect={() => onSelectProfessional?.(null)}
              />
              {divider}
            </li>
            {professionals.map(({ id, name, specialty, yearsOfExperience, rating, photoUrl }) => (
              <li key={id} className="flex flex-col gap-(--space-2)">
                <ProfessionalOption
                  leading={<Avatar src={photoUrl} alt={`Foto de ${name}`} />}
                  title={name}
                  details={[
                    `${specialty} · ${yearsLabel(yearsOfExperience)}`,
                    // TODO: "ver perfil" ainda não tem tela; por ora é só texto dentro da opção.
                    `★ ${ratingFormat.format(rating)} · ver perfil`,
                  ]}
                  onSelect={() => onSelectProfessional?.(id)}
                />
                {divider}
              </li>
            ))}
          </ul>

          {/* Desktop: "Sem preferência" em destaque, profissionais em grade. */}
          <section
            aria-labelledby="no-preference"
            className="hidden items-center gap-(--space-16) rounded-lg border-2 border-(--border-focus) bg-(--action-soft) p-(--space-20) lg:flex"
          >
            <Check aria-hidden="true" className="size-6 shrink-0 text-(--text-link)" />
            <div className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
              <h2 id="no-preference" className="type-heading text-(--text-link)">
                Sem preferência
              </h2>
              <p className="type-label text-(--text-muted)">
                Mostra mais horários disponíveis — a empresa escolhe quem atende
              </p>
            </div>
            <Button
              aria-label="Ver horários sem preferência de profissional"
              onClick={() => onSelectProfessional?.(null)}
            >
              Ver horários
            </Button>
          </section>

          <ul className="hidden grid-cols-3 gap-(--space-16) lg:grid">
            {professionals.map(({ id, name, specialty, yearsOfExperience, rating, photoUrl }) => (
              <li
                key={id}
                className="flex flex-col items-center gap-(--space-16) rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-(--space-20) text-center"
              >
                <Avatar
                  src={photoUrl}
                  alt={`Foto de ${name}`}
                  className="size-(--size-avatar-lg)"
                />
                <div className="flex flex-col items-center gap-(--space-2)">
                  <h2 className="type-body text-(--text-strong)">{name}</h2>
                  <p className="type-caption text-(--text-muted)">
                    {specialty} · {yearsLabel(yearsOfExperience)}
                  </p>
                  <p className="type-caption tabular flex items-center gap-(--space-4) text-(--text-body)">
                    <Star aria-hidden="true" className="size-4" />
                    <span>
                      <span className="sr-only">Nota </span>
                      {ratingFormat.format(rating)}
                    </span>
                  </p>
                </div>
                <Button
                  variant="secondary"
                  className="w-full"
                  aria-label={`Ver horários com ${name}`}
                  onClick={() => onSelectProfessional?.(id)}
                >
                  Ver horários
                </Button>
              </li>
            ))}
          </ul>
        </main>
      </PageContainer>
    </div>
  )
}
