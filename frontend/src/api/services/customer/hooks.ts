import { customerService } from '.'
import { queryKeys } from '../query-keys'
import { useServiceMutation } from '@api/base'

/**
 * Completar o cadastro de consumidor de uma conta que nasceu sem o perfil (assistente de estabelecimento ou convite).
 * Ao terminar, `me` é recarregado: `hasCustomerProfile` passa a ser verdadeiro.
 */
export const useCompleteCustomerProfile = () =>
  useServiceMutation({
    service: ({ birthDate, socialName }: { birthDate: string; socialName: string | null }) =>
      customerService.register(birthDate, socialName),
    invalidates: [queryKeys.me],
    invalidateOn: 'settled',
  })
