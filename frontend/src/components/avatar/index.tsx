import type { AvatarProps } from './types'
import { User } from 'lucide-react'
import { cn } from 'cn'

export const Avatar = (props: AvatarProps) => {
  const { src, alt, className } = props

  return (
    <span
      className={cn(
        'flex size-(--size-avatar-md) shrink-0 items-center justify-center overflow-hidden rounded-(--radius-full) bg-(--bg-disabled)',
        className,
      )}
    >
      {src ? (
        <img src={src} alt={alt} className="size-full object-cover" />
      ) : (
        <User aria-hidden="true" className="size-5 text-(--text-muted)" />
      )}
    </span>
  )
}
