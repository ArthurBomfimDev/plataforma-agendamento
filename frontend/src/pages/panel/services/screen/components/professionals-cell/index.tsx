import { MAX_AVATARS, professionalCount } from '../../consts'

import { Button } from '@components/button'
import { ProfessionalAvatar } from '@components/professional-avatar'
import type { ProfessionalsCellProps } from './types'

/** "Quem executa": avatares sobrepostos (foto ou iniciais) e a contagem; sem ninguém, o atalho para designar. */
export const ProfessionalsCell = (props: ProfessionalsCellProps) => {
  const { professionals, onAssign } = props

  if (professionals.length === 0) {
    return (
      <div className="flex flex-col items-start gap-(--space-2)">
        <span className="type-body text-(--status-pending-fg)">ninguém</span>
        <Button variant="ghost" className="type-caption -ml-(--space-8)" onClick={onAssign}>
          designar profissional
        </Button>
      </div>
    )
  }

  const sorted = professionals.toSorted((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  return (
    <div className="flex flex-col gap-(--space-2)">
      <ul aria-label={sorted.map(({ name }) => name).join(', ')} className="flex -space-x-2">
        {sorted.slice(0, MAX_AVATARS).map(({ name, photo }) => (
          <li key={name}>
            <ProfessionalAvatar
              name={name}
              photo={photo}
              size="sm"
              className="border-2 border-(--bg-surface)"
            />
          </li>
        ))}
      </ul>
      <span className="type-caption text-(--text-muted)">
        {professionalCount(professionals.length)}
      </span>
    </div>
  )
}
