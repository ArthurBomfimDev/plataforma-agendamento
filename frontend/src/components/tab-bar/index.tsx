import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs'

import { Tabs as TabsPrimitive } from '@base-ui/react/tabs'
import type { TabBarProps } from './types'
import { cn } from 'cn'

/**
 * Abas do Figma (`Serviços · Profissionais · Avaliações`), construídas sobre o Tabs do shadcn
 * (Base UI). A lib cuida de `role`, `aria-*`, foco e navegação por setas; aqui entram os tokens
 * do design system e o sublinhado animado, que desliza entre as abas.
 */
export const TabBar = (props: TabBarProps) => {
  const { label, items, defaultId, listClassName, panelClassName, className } = props

  return (
    <Tabs defaultValue={defaultId ?? items[0]?.id} className={cn('gap-0', className)}>
      <TabsList
        variant="line"
        aria-label={label}
        className={cn(
          'relative w-full justify-start gap-(--space-24) overflow-x-auto rounded-none border-b border-(--border-subtle) bg-(--bg-surface) px-(--space-16) py-(--space-2) group-data-horizontal/tabs:h-auto',
          listClassName,
        )}
      >
        {items.map(({ id, label: itemLabel }) => (
          <TabsTrigger
            key={id}
            value={id}
            // Outline para dentro: o `overflow-x-auto` da lista cortaria um contorno com offset positivo.
            // O `after:hidden` some com o sublinhado por fade do shadcn; quem sublinha é o Indicator.
            className="type-label h-auto min-h-(--size-touch-min) flex-none items-start rounded-none px-(--space-4) pt-(--space-12) pb-0 text-(--text-muted) -outline-offset-2 after:hidden hover:text-(--text-muted) focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-(--border-focus) data-active:text-(--text-link)"
          >
            {itemLabel}
          </TabsTrigger>
        ))}
        <TabsPrimitive.Indicator className="absolute bottom-(--space-4) left-(--active-tab-left) h-0.75 w-(--active-tab-width) rounded-(--radius-full) bg-(--action-primary) transition-[left,width] duration-200 ease-out motion-reduce:transition-none" />
      </TabsList>

      {items.map(({ id, content }) => (
        <TabsContent key={id} value={id} className={panelClassName}>
          {content}
        </TabsContent>
      ))}
    </Tabs>
  )
}
