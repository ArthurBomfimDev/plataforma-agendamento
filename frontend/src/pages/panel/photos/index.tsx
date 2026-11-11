import { managementService } from '@api/services/management'
import { useProfessionalPhoto } from '@api/services/management/hooks'
import { queryKeys } from '@api/services/query-keys'
import { usePanelBusinessDetail } from '@api/services/panel/hooks'

import type { PhotosData } from './screen/types'
import { PhotosScreen } from './screen'
import { errorMessage } from '@api/base'
import { usePanelContext } from '@layouts/panel-layout/context'
import { useQueryClient } from '@tanstack/react-query'

/**
 * Painel — Fotos (Onda 7D). Enviar mostra o progresso (adaptador `xhr`, mesma porta da API); remover, pela
 * API comum. Depois de cada mudança, o painel do estabelecimento é buscado de novo.
 */
export const PanelPhotosRoute = () => {
  const { context, business, professionals } = usePanelContext()
  const queryClient = useQueryClient()
  const detail = usePanelBusinessDetail(context.businessId)
  const photo = useProfessionalPhoto(context.businessId)

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
          photos: detail.data.photos ?? [],
          professionals: professionals.map((professional) => ({
            id: professional.id,
            name: professional.displayName,
            specialty: professional.specialty,
            photo: professional.photo,
          })),
        }
      : { status: 'loading' }

  return (
    <PhotosScreen
      data={data}
      businessName={business.name}
      onUploadBusiness={(slot) => async (file, onProgress) => {
        const updated = await managementService.uploadBusinessImage(slot, file, onProgress)
        refresh()
        return updated[slot]
      }}
      onUploadShowcase={(slot) => async (file, onProgress) => {
        const updated = await managementService.uploadBusinessPhoto(slot, file, onProgress)
        refresh()
        // O lugar pode ter mudado (depois do fim, entra no primeiro livre): a foto nova é a de índice slot ou a última.
        return updated.photos?.[slot] ?? updated.photos?.at(-1) ?? null
      }}
      onRemoveShowcase={(slot) => async () => {
        await managementService.removeBusinessPhoto(slot)
        refresh()
      }}
      onReorderShowcase={async (order) => {
        await managementService.reorderBusinessPhotos(order)
        refresh()
      }}
      onRemoveBusiness={(slot) => async () => {
        await managementService.removeBusinessImage(slot)
        refresh()
      }}
      onUploadProfessional={photo.upload}
      onRemoveProfessional={photo.remove}
    />
  )
}
