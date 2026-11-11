import { managementService } from '.'
import { queryKeys } from '../query-keys'
import { useQueryClient } from '@tanstack/react-query'
import { useService } from '@api/base'

/**
 * Foto de um profissional, de qualquer tela do painel: a mesma rota e o mesmo cache, para Fotos e Equipe mostrarem a
 * mesma imagem. Depois de cada mudança, o painel e o lado público (vitrine, busca) são buscados de novo.
 */
export const useProfessionalPhoto = (businessId: string) => {
  const queryClient = useQueryClient()

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.panel(businessId) })
    void queryClient.invalidateQueries({ queryKey: ['businesses'] })
  }

  return {
    upload:
      (professionalId: string) => async (file: File, onProgress?: (percent: number) => void) => {
        const updated = await managementService.uploadProfessionalPhoto(
          professionalId,
          file,
          onProgress,
        )
        refresh()
        return updated.photo
      },
    remove: (professionalId: string) => async () => {
      await managementService.removeProfessionalPhoto(professionalId)
      refresh()
    },
  }
}

/** O perfil de profissional da própria conta. Só o profissional com conta (os outros papéis recebem 403). */
export const useMyProfessionalProfile = (businessId: string, enabled: boolean) =>
  useService({
    queryKey: queryKeys.panelMyProfile(businessId),
    service: (signal) => managementService.myProfile(signal),
    enabled,
    retry: false,
  })

export const usePanelExceptions = (businessId: string) =>
  useService({
    queryKey: queryKeys.panelExceptions(businessId),
    service: async (signal) => (await managementService.exceptions(signal)).items,
  })
