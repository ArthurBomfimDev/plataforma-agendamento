import { BASE_CLASS_NAME } from './consts'
import type { CardEstablishmentImageProps } from './types'
import { cn } from 'cn'

export const CardEstablishmentImage = (props: CardEstablishmentImageProps) => {
  const { src, alt, className } = props

  if (!src) {
    return (
      <div aria-hidden="true" className={cn(BASE_CLASS_NAME, 'bg-(--bg-disabled)', className)} />
    )
  }

  return <img src={src} alt={alt} className={cn(BASE_CLASS_NAME, 'object-cover', className)} />
}
