import { AnimatePresence, motion } from 'framer-motion'
import type { AgendaRailProps, AgendaRailSlot, AgendaRailVertical } from './types'
import { RAIL_VARIANTS, ROW_HEIGHT } from './consts'
import { REDUCED_MOTION_QUERY, useMediaQuery } from '@hooks/use-media-query'

import { cn } from 'cn'

const Slot = ({ kind, time, label }: AgendaRailSlot) => {
  if (kind === 'free') {
    return (
      // O tracejado é o uso autorizado da regra do design system: não use em mais nada.
      <div className="flex h-9.5 min-w-0 flex-1 items-center gap-2.25 rounded-(--radius-sm) border-[1.5px] border-dashed border-(--brand-accent) px-(--space-12)">
        <span className="size-1.75 shrink-0 rounded-(--radius-full) bg-(--brand-accent)" />
        <p className="type-label whitespace-nowrap text-(--brand-livre)">{time} · livre agora</p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'type-label flex h-9.5 min-w-0 flex-1 items-center gap-2.5 rounded-(--radius-sm) border-l-3 bg-(--brand-row) px-(--space-12) whitespace-nowrap',
        kind === 'appointment' ? 'border-(--brand-accent)' : 'border-(--brand-line) opacity-55',
      )}
    >
      <span className="text-(--brand-text)">{time}</span>
      <span className="truncate text-(--brand-dim)">{label}</span>
    </div>
  )
}

type AgendaProps = {
  vertical: AgendaRailVertical
  variants: Partial<typeof RAIL_VARIANTS>
  direction: number
}

const Agenda = ({ vertical, variants, direction }: AgendaProps) => {
  const { id, business, date, hours, slots, freeToday } = vertical
  const nowRow = slots.findIndex(({ kind }) => kind === 'free')

  return (
    <motion.div
      data-vertical={id}
      custom={direction}
      variants={variants.panel}
      initial="enter"
      animate="center"
      exit="exit"
      className="min-w-0 pt-4.5 pb-2.5"
    >
      <div className="flex items-baseline justify-between gap-(--space-12) px-(--space-20) pb-3.5 whitespace-nowrap">
        <p className="type-label text-(--brand-text)">{business}</p>
        <p className="type-caption text-(--brand-dim)">{date}</p>
      </div>
      <div className="h-px bg-(--brand-line)" />

      <div className="flex px-(--space-20) pt-2.5">
        <ul className="w-14.5 shrink-0">
          {hours.map((hour) => (
            <li key={hour} className="type-caption h-13 text-(--brand-dim)">
              {hour}
            </li>
          ))}
        </ul>
        <div className="relative min-w-0 flex-1">
          {slots.map((slot) => (
            <motion.div
              key={slot.time}
              variants={variants.row}
              className="flex h-13 items-center border-t border-(--brand-line)"
            >
              <Slot {...slot} />
            </motion.div>
          ))}
          {/* No topo da linha do vão livre: é o que explica o "livre agora". */}
          <div
            className="absolute right-0 -left-1 flex h-2 items-center"
            style={{ top: nowRow * ROW_HEIGHT - 4 }}
          >
            <motion.span
              variants={variants.now}
              className="size-2 shrink-0 rounded-(--radius-full) bg-(--brand-now)"
            />
            <motion.span
              variants={variants.rule}
              style={{ originX: 0 }}
              className="h-px min-w-0 flex-1 bg-(--brand-now)"
            />
            <motion.span
              variants={variants.now}
              className="type-caption font-medium! tracking-[0.8px] text-(--brand-now)"
            >
              AGORA
            </motion.span>
          </div>
        </div>
      </div>

      <motion.div
        variants={variants.row}
        className="flex items-center gap-(--space-8) px-(--space-20) pt-(--space-12)"
      >
        <span className="size-1.5 shrink-0 rounded-(--radius-full) bg-(--brand-pulse)" />
        <p className="type-caption text-(--brand-dim)">{freeToday} horários livres hoje</p>
      </motion.div>
    </motion.div>
  )
}

/**
 * Trilha de agenda do Figma (nó 427:286): recorte da agenda usado como campo visual nas telas de
 * conta. Na troca, a agenda que sai termina antes de a nova entrar, para os textos não se misturarem;
 * as duas deslizam no sentido da troca, com as linhas em cascata e a linha do agora por último. Sob
 * `prefers-reduced-motion` a troca é seca. Vive só na superfície de marca e é decorativa, por isso
 * `aria-hidden`.
 */
export const AgendaRail = (props: AgendaRailProps) => {
  const { verticals, activeId, direction = 1, className } = props
  const reducedMotion = useMediaQuery(REDUCED_MOTION_QUERY)
  const vertical = verticals.find(({ id }) => id === activeId)

  return (
    <div
      aria-hidden="true"
      className={cn(
        'grid min-w-0 overflow-hidden rounded-l-(--radius-lg) border border-r-0 border-(--brand-line) bg-(--brand-card)',
        className,
      )}
    >
      <AnimatePresence initial={false} custom={direction} mode="wait">
        {vertical && (
          <Agenda
            key={vertical.id}
            vertical={vertical}
            variants={reducedMotion ? {} : RAIL_VARIANTS}
            direction={direction}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
