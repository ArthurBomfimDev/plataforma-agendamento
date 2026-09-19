import { ShieldCheck } from 'lucide-react'

/**
 * Selo "Verificado". Sempre ícone + texto, nunca cor sozinha (Figma, componente Badge).
 */
export const VerifiedBadge = () => {
  return (
    <span className="type-caption inline-flex shrink-0 items-center gap-(--space-4) rounded-sm bg-(--action-soft) px-(--space-8) py-(--space-2) text-(--marker-verified)">
      <ShieldCheck aria-hidden="true" className="size-4" />
      Verificado
    </span>
  )
}
