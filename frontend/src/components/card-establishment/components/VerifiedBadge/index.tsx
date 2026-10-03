import { Badge } from '../../../ui/badge'
import { ShieldCheck } from 'lucide-react'

/**
 * Selo "Verificado", construído sobre o Badge do shadcn (Base UI). Sempre ícone + texto, nunca
 * cor sozinha (Figma, componente Badge).
 */
export const VerifiedBadge = () => {
  return (
    <Badge className="type-caption h-auto gap-(--space-4) rounded-sm bg-(--action-soft) px-(--space-8) py-(--space-2) text-(--marker-verified) [&>svg]:size-4!">
      <ShieldCheck aria-hidden="true" />
      Verificado
    </Badge>
  )
}
