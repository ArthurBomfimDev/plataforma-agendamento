import { MotionConfig, motion } from 'framer-motion'
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group'

import type { SegmentedControlProps } from './types'
import { cn } from 'cn'
import { useId } from 'react'

/** Mola curta e sem quique exagerado: a pílula chega rápido e assenta. */
const INDICATOR_TRANSITION = { type: 'spring', bounce: 0.18, duration: 0.45 } as const

/**
 * Seletor segmentado do Figma ("Sou consumidor · Sou estabelecimento", frames A01–A04),
 * construído sobre o ToggleGroup do shadcn (Base UI). A lib dá `aria-pressed`, navegação por
 * setas e foco; aqui entram os tokens e a pílula animada do Framer Motion, que desliza de um
 * segmento para o outro via `layoutId`.
 *
 * Sempre há uma opção escolhida: tocar na que já está ativa não a desmarca. A ativa difere da
 * inativa em fundo, borda e cor do texto — não só em cor.
 */
export const SegmentedControl = <T extends string>(props: SegmentedControlProps<T>) => {
  const { label, options, value, onValueChange, className } = props

  // Um `layoutId` por instância, para duas telas com o seletor não trocarem a pílula entre si.
  const indicatorId = `segmented-indicator-${useId()}`

  return (
    // Quem pediu menos movimento no sistema vê a pílula trocar de lugar sem deslizar.
    <MotionConfig reducedMotion="user">
      <ToggleGroup
        aria-label={label}
        value={[value]}
        onValueChange={([next]) => {
          if (next) onValueChange(next as T)
        }}
        // 2px entre os segmentos, como no Figma. Com `spacing={0}` o shadcn arredonda as pontas do
        // primeiro e do último item como num grupo colado, e o segmento ativo perderia o raio.
        spacing={0.5}
        className={cn(
          'w-full rounded-md border border-(--border-interactive) bg-(--bg-surface-raised) p-(--space-2)',
          className,
        )}
      >
        {options.map((option) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            className={cn(
              // Desfaz o visual do Toggle do shadcn: altura, raio, hover e o fundo de pressionado.
              // `isolate` cria a camada em que a pílula (-z-10) fica atrás do texto.
              'type-label relative isolate h-auto min-h-(--size-touch-min) min-w-0 flex-1 rounded-sm px-(--space-12) py-(--space-8) text-(--text-muted) transition-colors duration-200 hover:bg-transparent hover:text-(--text-strong) focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)',
              'aria-pressed:bg-transparent aria-pressed:text-(--text-strong) aria-pressed:hover:bg-transparent',
            )}
          >
            {option.label}
            {option.value === value && (
              <motion.span
                layoutId={indicatorId}
                transition={INDICATOR_TRANSITION}
                aria-hidden
                className="absolute inset-0 -z-10 rounded-sm border border-(--border-subtle) bg-(--bg-surface)"
              />
            )}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </MotionConfig>
  )
}
