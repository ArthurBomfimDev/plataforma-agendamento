import { CELL, SERVICES_TABLE_FEATURES } from './consts'

import type { ServiceRowsProps } from '../../types'
import { cn } from 'cn'
import { useServicesColumns } from './hooks/use-services-columns'
import { useTable } from '@tanstack/react-table'

/**
 * Tabela do Figma 18 (desktop), com TanStack Table: ele monta cabeçalhos, linhas e células a partir das
 * colunas; o markup e o estilo continuam daqui. Serviço ativo sem profissional ganha a borda de aviso à
 * esquerda: a lista diz o que o consumidor não consegue agendar.
 */
export const ServicesTable = (props: ServiceRowsProps) => {
  const { services, onEdit } = props

  const columns = useServicesColumns(onEdit)
  const table = useTable({
    features: SERVICES_TABLE_FEATURES,
    columns,
    data: services,
    getRowId: (service) => service.id,
  })

  return (
    <div className="overflow-hidden rounded-(--radius-md) border border-(--border-subtle) bg-(--bg-surface)">
      <table className="w-full table-fixed border-collapse text-left">
        <caption className="sr-only">Serviços do estabelecimento</caption>
        <colgroup>
          {table.getFlatHeaders().map((header) => (
            <col key={header.id} style={{ width: `${header.getSize()}%` }} />
          ))}
        </colgroup>
        <thead className="bg-(--bg-surface-raised)">
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id} className="border-b border-(--border-subtle)">
              {group.headers.map((header) => (
                <th
                  key={header.id}
                  scope="col"
                  className={cn(
                    CELL,
                    'type-caption font-medium tracking-[0.8px] text-(--text-muted) uppercase',
                  )}
                >
                  {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-(--border-subtle)">
          {table.getRowModel().rows.map((row) => {
            const { isActive, professionalNames } = row.original
            const unassigned = isActive && professionalNames.length === 0
            return (
              <tr key={row.id}>
                {row.getAllCells().map((cell, index) =>
                  index === 0 ? (
                    <th
                      key={cell.id}
                      scope="row"
                      className={cn(
                        CELL,
                        'text-left font-normal',
                        unassigned && 'shadow-[inset_3px_0_0_var(--status-pending-fg)]',
                      )}
                    >
                      <table.FlexRender cell={cell} />
                    </th>
                  ) : (
                    <td key={cell.id} className={CELL}>
                      <table.FlexRender cell={cell} />
                    </td>
                  ),
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
