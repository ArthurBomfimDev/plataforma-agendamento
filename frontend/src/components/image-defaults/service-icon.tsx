import { AutoAwesomeIcon, EcgHeartIcon } from '@assets/icons'

import { cn } from 'cn'

/** Ícone padrão de serviço, pela categoria do estabelecimento. Decorativo: o nome do serviço está ao lado. */
export const ServiceIcon = ({ category, className }: { category: string; className?: string }) => {
  const Icon = category === 'Saude' ? EcgHeartIcon : AutoAwesomeIcon
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-md bg-(--action-soft) text-(--text-link)',
        className,
      )}
    >
      <Icon className="size-5" />
    </span>
  )
}
