import { Avatar } from '@components/avatar'
import type { ProfessionalSelectorProps } from './types'
import { cn } from 'cn'
import { initials } from '@features/business-agenda/consts'
import { memo } from 'react'
import { motion } from 'framer-motion'

/**
 * De quem é a jornada: um botão por profissional, o escolhido em `action/primary` sólido. Quem não
 * tem jornada ganha borda âmbar mais grossa à esquerda e "sem jornada" por escrito — o aviso não
 * depende só da cor.
 *
 * No celular a fileira rola na horizontal, como o seletor da agenda (CLAUDE.md §3.1).
 *
 * Memorizado: editar a semana ou o bloqueio não redesenha os botões.
 */
export const ProfessionalSelector = memo((props: ProfessionalSelectorProps) => {
  const { professionals, selectedId, onSelect } = props

  const anyWithout = professionals.some(({ hasSchedule }) => !hasSchedule)

  return (
    <div className="flex flex-col gap-(--space-8) lg:flex-row lg:items-center">
      <ul
        aria-label="Profissional"
        className="-mx-(--space-16) flex gap-(--space-8) overflow-x-auto px-(--space-16) scrollbar-none lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0"
      >
        {professionals.map((professional) => {
          const active = professional.id === selectedId
          return (
            <li key={professional.id} className="shrink-0">
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onSelect(professional.id)}
                className={cn(
                  'relative isolate flex min-h-(--size-touch-min) items-center gap-2.5 rounded-md border border-(--border-subtle) bg-(--bg-surface) py-(--space-8) pr-(--space-16) pl-(--space-12) text-left transition-colors duration-200 hover:bg-(--bg-surface-raised) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)',
                  active && 'border-(--action-primary) bg-transparent hover:bg-transparent',
                  !professional.hasSchedule && 'border-l-3 border-(--status-pending-fg)',
                )}
              >
                {/* O fundo escolhido desliza de um profissional para o outro. */}
                {active && (
                  <motion.span
                    layoutId="schedule-professional"
                    aria-hidden
                    transition={{ type: 'spring', bounce: 0.18, duration: 0.45 }}
                    className="absolute -inset-px -z-10 rounded-md bg-(--action-primary)"
                  />
                )}
                <Avatar alt="" initials={initials(professional.name)} size="sm" />
                <span className="flex flex-col whitespace-nowrap">
                  <span
                    className={cn(
                      'type-label',
                      active ? 'text-(--text-on-action)' : 'text-(--text-strong)',
                    )}
                  >
                    {professional.name}
                  </span>
                  {!professional.hasSchedule && (
                    <span
                      className={cn(
                        'type-caption',
                        active ? 'text-(--text-on-action)' : 'text-(--status-pending-fg)',
                      )}
                    >
                      sem jornada
                    </span>
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      {anyWithout && (
        <p className="type-caption text-(--text-muted) lg:w-62.5">
          Profissional sem jornada não gera horário nenhum — o salão aparece sem disponibilidade
          para quem busca.
        </p>
      )}
    </div>
  )
})
