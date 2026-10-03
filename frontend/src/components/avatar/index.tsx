import { AvatarFallback, AvatarImage, Avatar as UiAvatar } from '../ui/avatar'

import type { AvatarProps } from './types'
import { User } from 'lucide-react'
import { cn } from 'cn'

/**
 * Avatar do Figma, variante "foto", construído sobre o Avatar do shadcn (Base UI). A lib cuida do
 * carregamento da imagem e mostra o fallback enquanto ela não chega ou se falhar.
 */
export const Avatar = (props: AvatarProps) => {
  const { src, alt, className } = props

  return (
    <UiAvatar
      className={cn(
        'size-(--size-avatar-md) overflow-hidden rounded-(--radius-full) after:hidden',
        className,
      )}
    >
      {src && <AvatarImage src={src} alt={alt} />}
      <AvatarFallback className="bg-(--bg-disabled)">
        <User aria-hidden="true" className="size-5 text-(--text-muted)" />
      </AvatarFallback>
    </UiAvatar>
  )
}
