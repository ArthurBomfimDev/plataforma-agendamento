import { AvatarFallback, AvatarImage, Avatar as UiAvatar } from '@components/ui/avatar'

import type { AvatarProps } from './types'
import { User } from 'lucide-react'
import { cn } from 'cn'

const SIZE_CLASSES: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'size-(--size-avatar-sm)',
  md: 'size-(--size-avatar-md)',
}

/**
 * Avatar do Figma, variantes "foto" e "iniciais", construído sobre o Avatar do shadcn (Base UI).
 * A lib cuida do carregamento da imagem e mostra o fallback enquanto ela não chega ou se falhar.
 */
export const Avatar = (props: AvatarProps) => {
  const { src, alt, initials, size = 'md', className } = props

  return (
    <UiAvatar
      className={cn(
        'overflow-hidden rounded-(--radius-full) after:hidden',
        SIZE_CLASSES[size],
        className,
      )}
    >
      {src && <AvatarImage src={src} alt={alt} />}
      {initials ? (
        <AvatarFallback className="type-label bg-(--action-soft) text-(--text-link)">
          <span aria-hidden="true">{initials}</span>
        </AvatarFallback>
      ) : (
        <AvatarFallback className="bg-(--bg-disabled)">
          <User aria-hidden="true" className="size-5 text-(--text-muted)" />
        </AvatarFallback>
      )}
    </UiAvatar>
  )
}
