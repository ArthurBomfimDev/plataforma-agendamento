import { AccountCircleIcon, ChevronRightIcon } from '@assets/icons'

import { LeaveBusiness } from '@components/leave-business'
import { PanelPage } from '@components/panel-page'
import type { PanelMoreScreenProps } from './types'
import { SECTIONS } from '@components/panel-sidebar/consts'
import { ThemeToggle } from '@components/theme-toggle'

const ITEM =
  'type-label flex min-h-(--size-touch-min) w-full items-center gap-(--space-12) rounded-md px-(--space-12) py-(--space-12) text-left text-(--text-body) hover:bg-(--bg-surface-raised) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)'

/**
 * "Mais", no celular (Onda 7D): as seções que não cabem nas abas — com os mesmos ícones da lateral do
 * desktop — e a conta, onde se troca de contexto e se sai. O profissional vê só a conta.
 */
export const PanelMoreScreen = (props: PanelMoreScreenProps) => {
  const { businessName, hiddenSections, onNavigate, onAccount, onLeave } = props
  const sections = SECTIONS.filter(
    ({ id }) => id !== 'agenda' && id !== 'requests' && !hiddenSections.includes(id),
  )

  return (
    <PanelPage title="Mais" subtitle={businessName}>
      <nav aria-label="Outras seções do painel">
        <ul className="flex flex-col gap-(--space-2)">
          {sections.map(({ id, label, icon: Icon }) => (
            <li key={id}>
              <button type="button" className={ITEM} onClick={() => onNavigate(id)}>
                <Icon aria-hidden="true" className="size-5 shrink-0" />
                <span className="min-w-0 flex-1">{label}</span>
                <ChevronRightIcon
                  aria-hidden="true"
                  className="size-5 shrink-0 text-(--text-muted)"
                />
              </button>
            </li>
          ))}
          <li>
            <button type="button" className={ITEM} onClick={onAccount}>
              <AccountCircleIcon aria-hidden="true" className="size-5 shrink-0" />
              <span className="min-w-0 flex-1">Conta: trocar de contexto ou sair</span>
              <ChevronRightIcon
                aria-hidden="true"
                className="size-5 shrink-0 text-(--text-muted)"
              />
            </button>
          </li>
          {/* No celular o painel não tem barra superior: o tema mora aqui. */}
          <li className={`${ITEM} justify-between`}>
            <span className="min-w-0 flex-1">Tema escuro</span>
            <ThemeToggle />
          </li>
        </ul>
      </nav>

      {onLeave && <LeaveBusiness businessName={businessName} onLeave={onLeave} />}
    </PanelPage>
  )
}
