import { PHOTOS_CARD, PHOTOS_OVERLINE } from '../../consts'

import type { BusinessImagesCardProps } from './types'
import { ImageUploader } from '@components/image-uploader'
import { StorefrontIcon } from '@assets/icons'

const FALLBACK =
  'flex size-full items-center justify-center bg-(--bg-surface-raised) text-(--text-muted)'

/** Logotipo do estabelecimento (Figma 19, primeiro cartão). A capa e as outras fotos moram na Vitrine. */
export const BusinessImagesCard = (props: BusinessImagesCardProps) => {
  const { logo, onUpload, onRemove } = props

  return (
    <section aria-labelledby="photos-business" className={PHOTOS_CARD}>
      <h2 id="photos-business" className={PHOTOS_OVERLINE}>
        Logotipo do estabelecimento
      </h2>
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
    </section>
  )
}
