import { DAY_STATUS_LABEL, HOLIDAY_LABEL } from './consts'
import { DayMarker, HolidayMarker } from './day-marker'

import type { CalendarDayStatus } from './types'
import type { ComponentProps } from 'react'
import { CalendarDayButton as UiCalendarDayButton } from '@components/ui/calendar'
import { cn } from 'cn'

const STATUSES: CalendarDayStatus[] = ['available', 'no-slots', 'closed', 'past']

/**
 * Célula de calendário do Figma (44×44), sobre o `CalendarDayButton` do shadcn, que cuida do foco
 * na navegação por setas. O estado chega pelos `modifiers` do react-day-picker.
 */
export const AvailabilityDayButton = (props: ComponentProps<typeof UiCalendarDayButton>) => {
  const { modifiers, children, ...buttonProps } = props

  const status = STATUSES.find((candidate) => modifiers[candidate]) ?? 'past'
  const isHoliday = Boolean(modifiers.holiday)
  const isSelected = Boolean(modifiers.selected)

  const accessibleStatus = [DAY_STATUS_LABEL[status], isHoliday && HOLIDAY_LABEL]
    .filter(Boolean)
    .join(', ')

  return (
    <UiCalendarDayButton
      {...buttonProps}
      modifiers={modifiers}
      aria-label={`${buttonProps['aria-label']}, ${accessibleStatus}`}
      // Desfaz o visual do botão do shadcn: o destaque fica no círculo de 32px, não na célula toda.
      className="aspect-auto h-(--size-touch-min) w-full min-w-0 justify-center gap-(--space-4) rounded-(--radius-full) bg-transparent text-inherit group-data-[focused=true]/day:ring-0 hover:bg-transparent hover:text-inherit focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-(--border-focus) disabled:opacity-100 data-[selected-single=true]:bg-transparent data-[selected-single=true]:text-inherit [&>span]:opacity-100"
    >
      <span className="flex flex-col items-center gap-(--space-4)">
        {isHoliday && <HolidayMarker className="absolute top-0.5 left-1/2 -translate-x-1/2" />}
        <span
          className={cn(
            'type-label tabular flex size-8 items-center justify-center rounded-(--radius-full)',
            status === 'available' ? 'text-(--text-body)' : 'font-normal',
            status === 'past' && 'text-(--text-disabled)',
            (status === 'closed' || status === 'no-slots') && 'text-(--text-muted)',
            isSelected && 'bg-(--action-primary) font-semibold text-(--text-on-action)',
          )}
        >
          {children}
        </span>
        <DayMarker status={status} />
      </span>
    </UiCalendarDayButton>
  )
}
