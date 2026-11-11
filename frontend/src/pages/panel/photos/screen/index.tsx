import { ErrorState, LoadingState } from '@components/screen-state'

import { BusinessImagesCard } from './components/business-images-card'
import { PHOTOS_SUBTITLE } from './consts'
import { PanelPage } from '@components/panel-page'
import { ShowcaseCard } from './components/showcase-card'
import type { PhotosScreenProps } from './types'
import { TeamPhotosCard } from './components/team-photos-card'

/**
 * Painel — Fotos (Onda 7D; Figma 19 e 19b): logotipo e capa do estabelecimento e a foto de cada profissional, com
 * o `ImageUploader` (escolher, pré-visualizar, enviar com progresso, remover com confirmação, e os erros de
 * formato e tamanho do 19b). Só o dono (`RequireOwner`).
 *
 * A foto do profissional ativo vai para a página pública (ADR-031). Para quem não tem login, o servidor exige antes a
 * declaração do dono (checkbox em Profissionais → Editar); sem ela, o envio é recusado.
 */
export const PhotosScreen = (props: PhotosScreenProps) => {
  const {
    data,
    businessName,
    onUploadBusiness,
    onRemoveBusiness,
    onUploadShowcase,
    onRemoveShowcase,
    onReorderShowcase,
    onUploadProfessional,
    onRemoveProfessional,
  } = props

  return (
    <PanelPage wide title="Fotos" subtitle={PHOTOS_SUBTITLE(businessName)}>
      {data.status === 'loading' ? (
        <LoadingState label="Carregando as imagens…" />
      ) : data.status === 'error' ? (
        <ErrorState message={data.message} onRetry={data.onRetry} />
      ) : (
        <>
          <BusinessImagesCard
            logo={data.logo}
            onUpload={onUploadBusiness}
            onRemove={onRemoveBusiness}
          />
          <ShowcaseCard
            photos={data.photos}
            onUpload={onUploadShowcase}
            onRemove={onRemoveShowcase}
            onReorder={onReorderShowcase}
          />
          <TeamPhotosCard
            professionals={data.professionals}
            onUpload={onUploadProfessional}
            onRemove={onRemoveProfessional}
          />
        </>
      )}
    </PanelPage>
  )
}
