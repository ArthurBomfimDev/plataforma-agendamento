import type { AgendaHeaderProps } from './types'
import { Button } from '@components/button'
import { COUNTER_BOOKING_LABEL } from '@pages/panel/agenda/screen/consts'

/**
 * Cabeçalho da agenda (tela 09): título e data, "Dia · Semana · Mês" e "+ Marcação de balcão" na primeira linha,
 * como no Figma. Abaixo, fora do wireframe, o período (anterior, calendário, próximo, hoje) e os filtros — numa linha
 * só no desktop, empilhados no celular.
 */
export const AgendaHeader = (props: AgendaHeaderProps) => {
  const { title, caption, controls, onCounterBooking } = props

  return (
    <div className="flex flex-col gap-(--space-12)">
      <div className="flex flex-wrap items-center gap-(--space-12) lg:gap-(--space-16)">
        <div className="flex min-w-0 flex-1 basis-60 flex-col gap-(--space-2)">
          {/* Desktop (09): o título sobe de `heading` para `title`. */}
          <h1 className="type-heading text-(--text-strong) lg:text-(length:--size-title)! lg:leading-(--line-height-title)!">
            {title}
          </h1>
          <p className="type-caption text-(--text-muted) first-letter:uppercase">{caption}</p>
        </div>
        {controls?.viewSwitch}
        {onCounterBooking && (
          <Button className="hidden lg:inline-flex" onClick={onCounterBooking}>
            {COUNTER_BOOKING_LABEL}
          </Button>
        )}
      </div>
      {controls && (
        <div className="flex flex-col gap-(--space-8) lg:flex-row lg:items-center lg:justify-between lg:gap-(--space-16)">
          {controls.navigator}
          {controls.filters}
        </div>
      )}
    </div>
  )
}
