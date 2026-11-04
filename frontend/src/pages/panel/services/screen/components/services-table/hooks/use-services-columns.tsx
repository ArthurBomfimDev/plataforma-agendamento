import { STATE_BADGE, STATE_LABEL } from '../../../consts'

import { Button } from '@components/button'
import { ProfessionalsCell } from '../../professionals-cell'
import type { ServiceColumn } from '../types'
import { cn } from 'cn'
import { formatCents } from '@pages/panel/services/components/service-form/consts'
import { useMemo } from 'react'

/**
 * Colunas da tabela (Figma 18). `size` é o peso de cada coluna na largura (somam 100): a tabela usa
 * `table-layout: fixed`, então ele vira a largura em %, não pixels.
 *
 * Serviço ativo sem profissional ganha o texto de aviso; pausado fica em cinza. As ações dependem de
 * `onEdit`, por isso as colunas nascem num hook e só mudam quando ele muda.
 */
export const useServicesColumns = (onEdit?: (serviceId: string) => void) =>
  useMemo<ServiceColumn[]>(
    () => [
      {
        id: 'name',
        header: 'Serviço',
        size: 29,
        cell: ({ row }) => {
          const { name, description, isActive, professionalNames } = row.original
          const unassigned = isActive && professionalNames.length === 0
          return (
            <>
              <p
                className={cn(
                  'type-body',
                  isActive ? 'text-(--text-strong)' : 'text-(--text-muted)',
                )}
              >
                {name}
              </p>
              <p
                className={cn(
                  'type-caption truncate',
                  unassigned ? 'text-(--status-pending-fg)' : 'text-(--text-muted)',
                )}
              >
                {unassigned
                  ? 'Sem profissional designado'
                  : isActive
                    ? description
                    : 'Não aparece para o consumidor'}
              </p>
            </>
          )
        },
      },
      {
        id: 'time',
        header: 'Tempo na agenda',
        size: 17,
        cell: ({ row }) => (
          <>
            <p className="type-body tabular text-(--text-body)">
              {row.original.durationMinutes} min
            </p>
            <p className="type-caption tabular text-(--text-muted)">
              bloqueia {row.original.blockedMinutes} com os buffers
            </p>
          </>
        ),
      },
      {
        id: 'price',
        header: 'Preço',
        size: 11,
        cell: ({ row }) => (
          <span
            className={cn(
              'type-body tabular',
              row.original.isActive ? 'text-(--text-strong)' : 'text-(--text-muted)',
            )}
          >
            {formatCents(row.original.priceCents)}
          </span>
        ),
      },
      {
        id: 'professionals',
        header: 'Quem executa',
        size: 19,
        cell: ({ row }) => (
          <ProfessionalsCell
            names={row.original.professionalNames}
            onAssign={() => onEdit?.(row.original.id)}
          />
        ),
      },
      {
        id: 'state',
        header: 'Estado',
        size: 12,
        cell: ({ row }) => (
          <span
            className={cn(
              'type-label inline-flex min-h-8 min-w-18 items-center justify-center rounded-(--radius-sm) border px-(--space-12) py-(--space-4) whitespace-nowrap',
              STATE_BADGE[`${row.original.isActive}`],
            )}
          >
            {STATE_LABEL[`${row.original.isActive}`]}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Ações</span>,
        size: 12,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            className="-ml-(--space-8)"
            aria-label={`Editar ${row.original.name}`}
            onClick={() => onEdit?.(row.original.id)}
          >
            editar
          </Button>
        ),
      },
    ],
    [onEdit],
  )
