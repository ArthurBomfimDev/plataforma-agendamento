import { ImageIcon, StorefrontIcon } from '@assets/icons'
import { PHOTOS_CARD, PHOTOS_OVERLINE } from '../../consts'

import type { BusinessImagesCardProps } from './types'
import { ImageUploader } from '@components/image-uploader'

const FALLBACK =
  'flex size-full items-center justify-center bg-(--bg-surface-raised) text-(--text-muted)'

/** Logotipo e capa do estabelecimento (Figma 19, primeiro cartão): lado a lado no tablet em diante. */
export const BusinessImagesCard = (props: BusinessImagesCardProps) => {
  const { logo, cover, onUpload, onRemove } = props

  return (
    <section aria-labelledby="photos-business" className={PHOTOS_CARD}>
      <h2 id="photos-business" className={PHOTOS_OVERLINE}>
        Imagens do estabelecimento
      </h2>
      <div className="flex flex-col gap-(--space-24) md:flex-row md:gap-7">
        <div className="md:w-44 md:shrink-0">
          <ImageUploader
            id="photo-logo"
            label="Logotipo · quadrado"
            removeOf="do logotipo"
            shape="square"
            current={logo}
            fallback={
              <span className={FALLBACK}>
                <StorefrontIcon aria-hidden="true" className="size-8" />
              </span>
            }
            onUpload={onUpload('logo')}
            onRemove={onRemove('logo')}
          />
        </div>
        <div className="min-w-0 flex-1">
          <ImageUploader
            id="photo-cover"
            label="Capa · 3:1, cortada no centro"
            helpExtra="no celular aparece só a faixa central"
            removeOf="da capa"
            shape="cover"
            current={cover}
            fallback={
              <span className={FALLBACK}>
                <ImageIcon aria-hidden="true" className="size-8" />
              </span>
            }
            onUpload={onUpload('cover')}
            onRemove={onRemove('cover')}
          />
        </div>
      </div>
      <p className="type-caption text-(--text-muted)">
        Sem imagem, a página usa a ilustração padrão da categoria — o estabelecimento continua
        aparecendo na busca. Removemos os dados de localização (EXIF) de toda imagem antes de
        publicar.
      </p>
    </section>
  )
}
