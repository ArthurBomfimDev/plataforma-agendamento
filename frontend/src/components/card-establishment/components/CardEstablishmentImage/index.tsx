import { BASE_CLASS_NAME } from './consts'
import { BusinessIllustration } from '@global/images/defaults/business-illustration'
import type { CardEstablishmentImageProps } from './types'
import { SmartImage } from '@components/smart-image'
import { cn } from 'cn'

/** Capa do card (16:9). Sem capa — ou se ela falhar —, a ilustração da categoria (Onda 6D). */
export const CardEstablishmentImage = (props: CardEstablishmentImageProps) => {
  const { image, category, className } = props

  return (
    <SmartImage
      image={image}
      // O nome do estabelecimento já está no card: a foto é decorativa.
      alt=""
      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
      width={16}
      height={9}
      fallback={<BusinessIllustration category={category ?? 'Beleza'} />}
      className={cn(BASE_CLASS_NAME, className)}
    />
  )
}
