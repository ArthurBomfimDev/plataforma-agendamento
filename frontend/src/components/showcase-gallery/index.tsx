import { GRID_BY_COUNT, TILE_BY_POSITION, photoAlt, showcasePhotos } from './consts'

import { BusinessIllustration } from '@components/image-defaults/business-illustration'
import { SmartImage } from '@components/smart-image'
import type { ShowcaseGalleryProps } from './types'
import { cn } from 'cn'

/**
 * Vitrine da página do estabelecimento (03/03D): até 3 fotos dele, a primeira é a capa. No computador, a principal e as
 * outras ao lado; no celular, uma faixa que rola na horizontal. Cada foto tem texto alternativo. Sem foto, a ilustração
 * padrão da categoria ocupa o lugar — nunca uma área vazia.
 */
export const ShowcaseGallery = (props: ShowcaseGalleryProps) => {
  const { name, category, photos, cover } = props
  const shown = showcasePhotos(photos, cover)

  if (shown.length === 0) {
    return (
      <div className="h-45 w-full overflow-hidden md:rounded-lg lg:h-65">
        <BusinessIllustration category={category} />
      </div>
    )
  }

  return (
    <ul
      aria-label={`Fotos de ${name}`}
      className={cn(
        // Celular: faixa que rola, encaixando foto a foto. Computador: a grade de `GRID_BY_COUNT`.
        'flex snap-x snap-mandatory gap-(--space-8) overflow-x-auto overscroll-x-contain [scrollbar-width:none] lg:h-65 lg:snap-none lg:overflow-visible [&::-webkit-scrollbar]:hidden',
        GRID_BY_COUNT[shown.length],
      )}
    >
      {shown.map((photo, index) => (
        <li
          key={photo.medium}
          className={cn(
            'h-45 shrink-0 snap-center overflow-hidden md:rounded-lg lg:h-full lg:min-h-0 lg:w-auto lg:min-w-0',
            shown.length === 1 ? 'w-full' : 'w-[85%] md:w-[70%] lg:w-auto',
            TILE_BY_POSITION(index, shown.length),
          )}
        >
          <SmartImage
            image={photo}
            alt={photoAlt(name, index, shown.length)}
            sizes={
              index === 0 ? '(min-width: 1024px) 66vw, 85vw' : '(min-width: 1024px) 300px, 85vw'
            }
            width={16}
            height={9}
            fallback={<BusinessIllustration category={category} />}
            className="size-full"
          />
        </li>
      ))}
    </ul>
  )
}
