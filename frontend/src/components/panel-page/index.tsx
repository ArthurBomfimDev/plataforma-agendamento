import { PANEL_CONTENT_BOTTOM_PADDING } from '@components/bottom-navigation/consts'
import type { PanelPageProps } from './types'
import { cn } from 'cn'

/**
 * Moldura das telas de gestão do painel (Onda 7D), no mesmo desenho dos pedidos (tela 10): no celular, o
 * título fica num cabeçalho fixo; no desktop, ao lado das ações, no topo do conteúdo. Vive dentro do
 * `PanelLayout`, que já tem a navegação.
 *
 * TODO(figma): não há wireframe das telas de gestão; seguem os tokens e o desenho das telas 10 e 11.
 */
export const PanelPage = (props: PanelPageProps) => {
  const { title, subtitle, actions, children } = props

  return (
    <>
      {/* Celular e tablet */}
      <header className="sticky top-0 z-10 border-b border-(--border-subtle) bg-(--bg-surface) pt-[calc(var(--space-16)+env(safe-area-inset-top))] pb-(--space-12) lg:hidden">
        <div className="flex items-center gap-(--space-12) px-(--space-16) md:mx-auto md:max-w-160">
          <div className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
            <h1 className="type-heading text-(--text-strong)">{title}</h1>
            {subtitle && <p className="type-caption text-(--text-muted)">{subtitle}</p>}
          </div>
          {actions}
        </div>
      </header>

      <main
        className={cn(
          'flex flex-col gap-(--space-16) px-(--space-16) pt-(--space-12) md:mx-auto md:max-w-160 lg:mx-0 lg:max-w-200 lg:px-(--space-24) lg:pt-(--space-24)',
          PANEL_CONTENT_BOTTOM_PADDING,
        )}
      >
        {/* Desktop */}
        <div className="hidden items-center gap-(--space-16) lg:flex">
          <div className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
            <h1 className="type-heading text-(--text-strong)">{title}</h1>
            {subtitle && <p className="type-caption text-(--text-muted)">{subtitle}</p>}
          </div>
          {actions}
        </div>

        {children}
      </main>
    </>
  )
}

/** Cartão de seção, igual ao do cadastro de serviço (tela 11). */
export const PANEL_CARD =
  'flex flex-col gap-(--space-12) rounded-lg border border-(--border-subtle) bg-(--bg-surface) px-(--space-16) py-(--space-16)'

/** Aviso destacado (saúde, consentimento): borda à esquerda e ícone, nunca só cor. */
export const PANEL_NOTICE =
  'type-caption flex items-start gap-(--space-8) rounded-md border border-l-3 border-(--status-pending-fg) bg-(--status-pending-bg) py-(--space-8) pr-(--space-12) pl-(--space-12) text-(--status-pending-fg)'
