import { AccountCircleIcon, CheckIcon, ChevronDownIcon, LogoutIcon } from '@assets/icons'

import type { AccountMenuProps } from './types'
import { Menu } from '@base-ui/react/menu'
import { cn } from 'cn'

const ITEM =
  'type-label flex min-h-(--size-touch-min) cursor-default items-center gap-(--space-8) rounded-sm px-(--space-12) py-(--space-8) text-(--text-body) outline-none select-none data-highlighted:bg-(--bg-surface-raised) data-highlighted:text-(--text-strong)'

/**
 * Menu da conta (Onda 7A): mostra o contexto atual e troca para consumidor ou para o painel de um
 * estabelecimento (decisão de 22/09, §2.0, modelo iFood). Menu do Base UI: setas, Esc, foco
 * devolvido ao botão.
 */
export const AccountMenu = (props: AccountMenuProps) => {
  const {
    currentLabel,
    items,
    onSelect,
    onAccount,
    onSignOut,
    align = 'end',
    side = 'bottom',
    className,
  } = props

  return (
    <Menu.Root>
      <Menu.Trigger
        className={cn(
          'type-label flex min-h-(--size-touch-min) max-w-64 items-center gap-(--space-8) rounded-md border border-(--border-interactive) bg-(--bg-surface) px-(--space-12) py-(--space-8) text-(--text-body) hover:bg-(--bg-surface-raised) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)',
          className,
        )}
      >
        <span className="sr-only">Conta: </span>
        <span className="truncate">{currentLabel}</span>
        <ChevronDownIcon aria-hidden="true" className="size-4 shrink-0" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side={side} align={align} sideOffset={8} className="z-50">
          <Menu.Popup className="flex min-w-60 flex-col gap-(--space-2) rounded-md border border-(--border-subtle) bg-(--bg-surface) p-(--space-4) shadow-(--elevation-card) outline-none">
            {items.length > 1 && (
              <Menu.Group>
                <Menu.GroupLabel className="type-caption px-(--space-12) py-(--space-4) text-(--text-muted)">
                  Entrar como
                </Menu.GroupLabel>
                {items.map((item) => (
                  <Menu.Item
                    key={item.id}
                    className={ITEM}
                    aria-current={item.current ? 'true' : undefined}
                    onClick={() => !item.current && onSelect(item.id)}
                  >
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {item.current && (
                      <CheckIcon
                        aria-hidden="true"
                        className="size-4 shrink-0 text-(--text-link)"
                      />
                    )}
                  </Menu.Item>
                ))}
                <Menu.Separator className="my-(--space-4) h-px bg-(--border-subtle)" />
              </Menu.Group>
            )}
            {onAccount && (
              <Menu.Item className={ITEM} onClick={onAccount}>
                <AccountCircleIcon aria-hidden="true" className="size-4 shrink-0" />
                Minha conta
              </Menu.Item>
            )}
            <Menu.Item className={ITEM} onClick={onSignOut}>
              <LogoutIcon aria-hidden="true" className="size-4 shrink-0" />
              Sair
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
