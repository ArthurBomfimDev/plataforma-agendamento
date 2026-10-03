import { Avatar } from '../../components/avatar'
import { ChevronLeft } from 'lucide-react'
import type { ChooseProfessionalScreenProps } from './types'
import { MOCK_BUSINESSES } from '../business-detail/mock'
import { MOCK_PROFESSIONALS } from './mock'
import { NotFoundScreen } from '../not-found'
import { ProfessionalOption } from '../../components/professional-option'
import { priceFormat } from '../../components/service-card/consts'
import { ratingFormat } from '../../components/card-establishment/consts'

const yearsLabel = (years: number) => `${years} ${years === 1 ? 'ano' : 'anos'}`

const divider = <hr aria-hidden="true" className="h-px w-full border-0 bg-(--border-subtle)" />

/**
 * Tela 04 · Escolher profissional (Figma, 390px).
 */
export const ChooseProfessionalScreen = (props: ChooseProfessionalScreenProps) => {
  const { businessId, serviceId, onBack, onSelectProfessional } = props

  const service = MOCK_BUSINESSES[businessId]?.services.find(({ id }) => id === serviceId)

  if (!service) {
    return <NotFoundScreen />
  }

  const professionals = MOCK_PROFESSIONALS[businessId] ?? []

  return (
    <div className="min-h-dvh bg-(--bg-surface) pb-[env(safe-area-inset-bottom)]">
      <header className="flex items-center gap-(--space-12) px-(--space-16) pt-[calc(var(--space-16)+env(safe-area-inset-top))] pb-(--space-8)">
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
          {service.name} · {service.durationMinutes} min ·{' '}
          {priceFormat.format(service.priceCents / 100)}
        </p>
      </header>

      <main className="flex flex-col gap-(--space-20) px-(--space-16) pt-(--space-12) pb-(--space-16)">
        <h1 className="type-title text-(--text-strong)">Com quem você quer agendar?</h1>

        <ul className="flex flex-col gap-(--space-2)">
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
      </main>
    </div>
  )
}
