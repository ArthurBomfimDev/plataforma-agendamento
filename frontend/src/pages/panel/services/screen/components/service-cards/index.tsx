import { STATE_BADGE, STATE_LABEL, serviceSummary } from '../../consts'

import { Button } from '@components/button'
import { GuidedStepBar } from '../guided-step-bar'
import { PANEL_CARD } from '@components/panel-page'
import { ProfessionalsCell } from '../professionals-cell'
import type { ServiceRowsProps } from '../../types'
import { cn } from 'cn'

/** Celular e tablet: a mesma lista da tabela, um cartão por serviço, em grade. */
export const ServiceCards = (props: ServiceRowsProps) => {
  const { services, onEdit, guide } = props

  return (
    <ul className="grid grid-cols-1 gap-(--space-12) md:grid-cols-2">
      {services.map((service) => {
        const unassigned = service.isActive && service.professionalNames.length === 0
        const guided = guide?.serviceId === service.id
        return (
          <li
            key={service.id}
            className={cn(
              PANEL_CARD,
              unassigned && !guided && 'border-l-3 border-l-(--status-pending-fg)',
              guided && 'border-2 border-(--border-focus)',
            )}
          >
            <div className="flex items-start gap-(--space-12)">
              <div className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
                <h2
                  className={cn(
                    'type-label',
                    service.isActive ? 'text-(--text-strong)' : 'text-(--text-muted)',
                  )}
                >
                  {service.name}
                </h2>
                <p className="type-caption tabular text-(--text-body)">{serviceSummary(service)}</p>
                <p className="type-caption tabular text-(--text-muted)">
                  bloqueia {service.blockedMinutes} com os buffers
                </p>
              </div>
              <span
                className={cn(
                  'type-label inline-flex min-h-8 min-w-18 shrink-0 items-center justify-center rounded-(--radius-sm) border px-(--space-12) py-(--space-4) whitespace-nowrap',
                  STATE_BADGE[`${service.isActive}`],
                )}
              >
                {STATE_LABEL[`${service.isActive}`]}
              </span>
            </div>
            <ProfessionalsCell
              names={service.professionalNames}
              onAssign={() => onEdit?.(service.id)}
            />
            <div className="flex flex-wrap gap-(--space-8)">
              <Button
                variant="secondary"
                aria-label={`Editar ${service.name}`}
                onClick={() => onEdit?.(service.id)}
              >
                Editar
              </Button>
            </div>
            {guided && <GuidedStepBar guide={guide} onAssign={() => onEdit?.(service.id)} />}
          </li>
        )
      })}
    </ul>
  )
}
