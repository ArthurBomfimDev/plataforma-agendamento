import { Avatar } from '@components/avatar'
import { Button } from '@components/button'
import type { BusinessProfessional } from '@pages/customer/booking/choose-professional/screen/types'
import { initials } from '@pages/panel/agenda/screen/consts'
import { mediaUrl } from '@api/services/media'
import { ratingFormat } from '@components/card-establishment/consts'

export type ProfessionalsListProps = {
  /** Ausente: ainda carregando. Vazio: o estabelecimento não tem profissional ativo. */
  professionals: BusinessProfessional[] | undefined
  onOpen: (professionalId: string) => void
}

/**
 * Aba "Profissionais" da página do estabelecimento (ADR-031): foto ou iniciais, nome, especialidade e o botão que abre a
 * página do profissional. Só aparecem os ativos (a API só devolve esses).
 */
export const ProfessionalsList = ({ professionals, onOpen }: ProfessionalsListProps) => {
  if (!professionals) {
    return (
      <p role="status" aria-busy="true" className="type-body text-(--text-muted)">
        Carregando a equipe…
      </p>
    )
  }

  if (professionals.length === 0) {
    return (
      <p role="status" className="type-body text-(--text-muted)">
        Este estabelecimento ainda não tem profissionais.
      </p>
    )
  }

  return (
    <ul className="grid gap-(--space-12) sm:grid-cols-2">
      {professionals.map((professional) => (
        <li
          key={professional.id}
          className="flex items-center gap-(--space-12) rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-(--space-12)"
        >
          <Avatar
            alt=""
            src={professional.photo ? mediaUrl(professional.photo.small) : undefined}
            initials={initials(professional.name)}
            size="lg"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
            <p className="type-body truncate text-(--text-strong)">{professional.name}</p>
            {professional.specialty && (
              <p className="type-caption truncate text-(--text-muted)">{professional.specialty}</p>
            )}
            {professional.rating !== undefined && (
              <p className="type-caption text-(--text-body)">
                Nota {ratingFormat.format(professional.rating)}
              </p>
            )}
          </div>
          <Button
            variant="secondary"
            aria-label={`Ver perfil de ${professional.name}`}
            onClick={() => onOpen(professional.id)}
          >
            Ver perfil
          </Button>
        </li>
      ))}
    </ul>
  )
}
