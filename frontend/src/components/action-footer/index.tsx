import type { ActionFooterProps } from './types'

/**
 * Barra fixa de ação no rodapé do celular (continuar, enviar, ver agendamentos). Respeita a safe-area (regra 6 de
 * empacotamento); no desktop some, e a ação fica no corpo da tela.
 */
export const ActionFooter = ({ children }: ActionFooterProps) => (
  <footer className="fixed inset-x-0 bottom-0 flex flex-col gap-(--space-8) border-t border-(--border-subtle) bg-(--bg-surface) px-(--space-16) pt-(--space-12) pb-[calc(var(--space-16)+env(safe-area-inset-bottom))] shadow-(--elevation-bar) md:px-[max(var(--space-16),calc((100%-40rem)/2+var(--space-16)))] lg:hidden">
    {children}
  </footer>
)
