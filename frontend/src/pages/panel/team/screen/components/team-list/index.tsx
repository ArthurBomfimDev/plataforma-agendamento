import { MotionConfig, motion } from 'framer-motion'
import { Button } from '@components/button'
import { ProfessionalAvatar } from '@components/professional-avatar'
import type { TeamListProps } from './types'
import { cn } from 'cn'
import { listCaption } from '../../consts'

/**
 * A equipe (Figma 17, coluna da esquerda): um item por profissional, com o selecionado em destaque. Quem
 * está ativo e sem jornada, ou desativado, ganha a borda e o texto de aviso: o dono vê quem não tem horário.
 */
export const TeamList = (props: TeamListProps) => {
  const { members, services, selectedId, onSelect, onNew, onSelf } = props

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex flex-col gap-(--space-12)">
        <ul className="flex flex-col overflow-clip rounded-(--radius-md) border border-(--border-subtle) bg-(--bg-surface) p-(--space-8)">
          {members.map((member) => {
            const selected = member.id === selectedId
            const warnings = [
              ...(member.isActive ? [] : ['Inativo']),
              ...(member.isActive && !member.workSummary ? ['sem jornada'] : []),
            ]
            return (
              <li key={member.id}>
                <button
                  type="button"
                  aria-current={selected ? 'true' : undefined}
                  aria-label={member.displayName}
                  onClick={() => onSelect(member.id)}
                  className={cn(
                    'relative isolate flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-(--radius-sm) px-2.5 py-(--space-8) text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)',
                    warnings.length > 0 && 'border-l-3 border-l-(--status-pending-fg)',
                  )}
                >
                  {/* O fundo do selecionado desliza de um profissional para o outro, como em Jornadas. */}
                  {selected && (
                    <motion.span
                      layoutId="team-member"
                      aria-hidden
                      transition={{ type: 'spring', bounce: 0.18, duration: 0.45 }}
                      className="absolute inset-0 -z-10 rounded-(--radius-sm) bg-(--bg-surface-selected)"
                    />
                  )}
                  <ProfessionalAvatar name={member.displayName} photo={member.photo} />
                  <span className="flex min-w-0 flex-1 flex-col gap-px">
                    <span
                      className={cn(
                        'type-label truncate',
                        selected
                          ? 'text-(--text-link)'
                          : member.isActive
                            ? 'text-(--text-strong)'
                            : 'text-(--text-muted)',
                      )}
                    >
                      {member.displayName}
                    </span>
                    <span
                      className={cn(
                        'type-caption truncate',
                        warnings.length > 0 ? 'text-(--status-pending-fg)' : 'text-(--text-muted)',
                      )}
                    >
                      {listCaption(member, services)}
                    </span>
                    {warnings.map((warning) => (
                      <span key={warning} className="type-caption text-(--status-pending-fg)">
                        {warning}
                      </span>
                    ))}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
        <Button variant="secondary" className="w-full" onClick={onNew}>
          Convidar profissional
        </Button>
        <Button variant="ghost" className="w-full" onClick={onSelf}>
          Eu também atendo
        </Button>
        <p className="type-caption text-(--text-muted)">
          Só o proprietário convida, remove e edita jornada. O profissional entra pela própria conta
          e vê apenas a agenda dele.
        </p>
      </div>
    </MotionConfig>
  )
}
