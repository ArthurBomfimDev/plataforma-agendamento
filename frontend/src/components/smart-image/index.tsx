import { mediaUrl, srcSetOf } from '@api/services/media'
import { useState } from 'react'

import type { SmartImageProps } from './types'
import { cn } from 'cn'

/**
 * Imagem enviada (Onda 6D) com os três tamanhos do backend em `srcSet`, carregamento preguiçoso e o espaço já
 * reservado pela proporção (`width`/`height`), sem salto de layout. Sem imagem, ou se ela falhar ao carregar,
 * mostra o padrão visual (`fallback`) no mesmo espaço.
 *
 * `alt` vazio = decorativa (o leitor de tela pula); com texto = informativa.
 */
export const SmartImage = (props: SmartImageProps) => {
  const { image, alt, sizes, width, height, fallback, className, imgClassName } = props
  const [failed, setFailed] = useState<string | null>(null)

  const broken = image && failed === image.medium
  const showImage = image && !broken

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      {showImage ? (
        <img
          src={mediaUrl(image.medium)}
          srcSet={srcSetOf(image)}
          sizes={sizes}
          width={width}
          height={height}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(image.medium)}
          className={cn('size-full object-cover', imgClassName)}
        />
      ) : (
        fallback
      )}
    </div>
  )
}
