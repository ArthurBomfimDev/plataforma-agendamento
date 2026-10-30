import type { BusinessDetailResponse, ProfessionalResponse } from '@lib/api/types'
import { manageApi, uploadPaths } from '@lib/api/endpoints'
import { queryKeys, usePanelBusinessDetail } from '@lib/api/queries'

import type { PhotosData } from '@features/panel-photos/types'
import { PhotosScreen } from '@features/panel-photos'
import { errorMessage } from '@lib/api/errors'
import { uploadFile } from '@lib/api/upload'
import { usePanelContext } from './panel-context'
import { useQueryClient } from '@tanstack/react-query'

/**
 * Painel — Fotos (Onda 7D). Enviar vai por `uploadFile` (progresso, mesma porta da API); remover, pela
 * API comum. Depois de cada mudança, o painel do estabelecimento é buscado de novo.
 */
export const PanelPhotosRoute = () => {
  const { context, business, professionals } = usePanelContext()
  const queryClient = useQueryClient()
  const detail = usePanelBusinessDetail(context.businessId)

  // O painel (lateral, Fotos) e o lado público (vitrine, busca, revisão do pedido): sem isto, a vitrine mostrava a
  // imagem antiga até o cache vencer.
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.panel(context.businessId) })
    void queryClient.invalidateQueries({ queryKey: ['businesses'] })
  }

  const data: PhotosData = detail.isError
    ? {
        status: 'error',
        message: errorMessage(detail.error),
        onRetry: () => void detail.refetch(),
      }
    : detail.data
      ? {
          status: 'ready',
          logo: detail.data.logo,
          cover: detail.data.cover,
          professionals: professionals.map((professional) => ({
            id: professional.id,
            name: professional.displayName,
            photo: professional.photo,
            isPubliclyVisible: professional.isPubliclyVisible,
          })),
        }
      : { status: 'loading' }

  return (
    <PhotosScreen
      data={data}
      businessName={business.name}
      onUploadBusiness={(slot) => async (file, onProgress) => {
        const updated = await uploadFile<BusinessDetailResponse>(
          uploadPaths.businessImage(slot),
          file,
          { onProgress },
        )
        refresh()
        return updated[slot]
      }}
      onRemoveBusiness={(slot) => async () => {
        await manageApi.removeBusinessImage(slot)
        refresh()
      }}
      onUploadProfessional={(professionalId) => async (file, onProgress) => {
        const updated = await uploadFile<ProfessionalResponse>(
          uploadPaths.professionalPhoto(professionalId),
          file,
          { onProgress },
        )
        refresh()
        return updated.photo
      }}
      onRemoveProfessional={(professionalId) => async () => {
        await manageApi.removeProfessionalPhoto(professionalId)
        refresh()
      }}
    />
  )
}
