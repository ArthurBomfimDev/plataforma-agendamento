import type { AddToCalendarMenuProps } from './types'
import { CALENDAR_OPTIONS } from './consts'
import { ChevronDownIcon } from '@assets/icons'
import { Menu } from '@base-ui/react/menu'
import { cn } from 'cn'

const ITEM =
  'type-label flex min-h-(--size-touch-min) cursor-default items-center gap-(--space-8) rounded-sm px-(--space-12) py-(--space-8) text-(--text-body) outline-none select-none data-highlighted:bg-(--bg-surface-raised) data-highlighted:text-(--text-strong)'

/**
 * "Adicionar à agenda": Google, Outlook ou o arquivo `.ics` (Apple e outros). Menu do Base UI: setas, Esc e foco
 * devolvido ao botão. A escolha vai para o hook `useAddToCalendar`, que abre o link ou baixa o arquivo.
 */
export const AddToCalendarMenu = (props: AddToCalendarMenuProps) => {
  const { onSelect, className } = props

  return (
    <Menu.Root>
      <Menu.Trigger
        className={cn(
          'type-label flex min-h-(--size-touch-min) items-center justify-center gap-(--space-8) rounded-md border border-(--border-interactive) bg-(--bg-surface) px-(--space-16) py-(--space-8) text-(--text-body) hover:bg-(--bg-surface-raised) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)',
          className,
        )}
      >
        Adicionar à agenda
        <ChevronDownIcon aria-hidden="true" className="size-4 shrink-0" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="top" align="end" sideOffset={8} className="z-50">
          <Menu.Popup className="flex min-w-60 flex-col gap-(--space-2) rounded-md border border-(--border-subtle) bg-(--bg-surface) p-(--space-4) shadow-(--elevation-card) outline-none">
            {CALENDAR_OPTIONS.map(({ target, label }) => (
              <Menu.Item key={target} className={ITEM} onClick={() => onSelect(target)}>
                {label}
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
