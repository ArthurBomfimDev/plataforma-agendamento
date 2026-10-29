import { SECTION_CARD, minutesLabel, previewSlots } from '../../consts'
import { memo, useMemo } from 'react'

import type { SlotPreviewProps } from './types'
import { TIME_SLOT_CHIP_CLASSES } from '@components/time-slot-chip/consts'
import { cn } from 'cn'

/**
 * "Horários que o consumidor verá": a mesma regra do cálculo de disponibilidade, num expediente de
 * exemplo, atualizada a cada tecla. Os chips são só ilustração — não são botões.
 *
 * TODO(figma): o wireframe mostra 8 horários e pula 10:45 e 11:00, que cabem; aqui aparecem todos.
 *
 * Memorizado: digitar nome, descrição ou preço não muda a grade.
 */
export const SlotPreview = memo((props: SlotPreviewProps) => {
  const { hours, occupancy, step } = props

  const { slots, firstLeftOut } = useMemo(
    () => previewSlots(hours, occupancy, step),
    [hours, occupancy, step],
  )

  return (
    <section aria-labelledby="slot-preview-title" className={SECTION_CARD}>
      <h2 id="slot-preview-title" className="type-label text-(--text-strong)">
        Horários que o consumidor verá
      </h2>
      <p className="type-caption text-(--text-muted)">
        Expediente {hours.start}–{hours.end}
        {step > 0 && `, passo de ${minutesLabel(step)}`}
      </p>

      {slots.length > 0 ? (
        <ul className="grid grid-cols-4 gap-(--space-8)">
          {slots.map((slot) => (
            <li key={slot} className={cn(TIME_SLOT_CHIP_CLASSES, 'px-0')}>
              {slot}
            </li>
          ))}
        </ul>
      ) : (
        <p className="type-caption text-(--text-body)">
          {occupancy > 0 && step > 0
            ? `Nenhum horário cabe: ${minutesLabel(occupancy)} passam do expediente.`
            : 'Preencha a duração e a granularidade para ver os horários.'}
        </p>
      )}

      {slots.length > 0 && firstLeftOut && (
        <p className="type-caption text-(--text-muted)">
          {firstLeftOut} não aparece: {minutesLabel(occupancy)} não cabem antes das {hours.end}.
        </p>
      )}
    </section>
  )
})
