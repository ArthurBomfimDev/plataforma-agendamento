import { ErrorState, LoadingState } from '@components/screen-state'

import { BusinessImagesCard } from './components/business-images-card'
import { PHOTOS_SUBTITLE } from './consts'
import { PanelPage } from '@components/panel-page'
import type { PhotosScreenProps } from './types'
import { TeamPhotosCard } from './components/team-photos-card'

/**
 * Painel — Fotos (Onda 7D; Figma 19 e 19b): logotipo e capa do estabelecimento e a foto de cada profissional, com
 * o `ImageUploader` (escolher, pré-visualizar, enviar com progresso, remover com confirmação, e os erros de
 * formato e tamanho do 19b). Só o dono (`RequireOwner`).
 *
 * A foto do profissional só vai para a página pública com o perfil completo dele, que exige o consentimento do
 * próprio profissional (decisões de 22/09 §3). Sem isso, a foto fica guardada e só aparece aqui.
 */
export const PhotosScreen = (props: PhotosScreenProps) => {
  const {
    data,
    businessName,
    onUploadBusiness,
    onRemoveBusiness,
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
            cover={data.cover}
            onUpload={onUploadBusiness}
            onRemove={onRemoveBusiness}
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
