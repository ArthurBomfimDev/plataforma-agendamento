import { MAX_AVATARS, initialsOf, professionalCount } from '../../consts'

import { Avatar } from '@components/avatar'
import { Button } from '@components/button'
import type { ProfessionalsCellProps } from './types'

/** "Quem executa": avatares sobrepostos e a contagem; sem ninguém, o atalho para designar. */
export const ProfessionalsCell = (props: ProfessionalsCellProps) => {
  const { names, onAssign } = props

  if (names.length === 0) {
    return (
      <div className="flex flex-col items-start gap-(--space-2)">
        <span className="type-body text-(--status-pending-fg)">ninguém</span>
        <Button variant="ghost" className="type-caption -ml-(--space-8)" onClick={onAssign}>
          designar profissional
        </Button>
      </div>
    )
  }

  const sorted = names.toSorted((a, b) => a.localeCompare(b, 'pt-BR'))
  return (
    <div className="flex flex-col gap-(--space-2)">
      <ul aria-label={sorted.join(', ')} className="flex -space-x-2">
        {sorted.slice(0, MAX_AVATARS).map((name) => (
          <li key={name}>
            <Avatar
              alt=""
              size="sm"
              initials={initialsOf(name)}
              className="border-2 border-(--bg-surface)"
            />
          </li>
        ))}
      </ul>
      <span className="type-caption text-(--text-muted)">{professionalCount(names.length)}</span>
    </div>
  )
}
