import { useService, useServiceMutation } from '@api/base'
import { useSignIn, useSwitchContext } from '../auth/hooks'

import { authService } from '../auth'
import { invitationService } from '.'
import { queryKeys } from '../query-keys'

/** A prévia do convite. Sem nova tentativa automática: link velho não melhora com insistência. */
export const useInvitationPreview = (token: string | null) =>
  useService({
    queryKey: queryKeys.invitationPreview(token ?? ''),
    service: (signal) => invitationService.preview(token ?? '', signal),
    enabled: Boolean(token),
    retry: false,
    staleTime: Infinity,
  })

export type AcceptInput =
  | {
      kind: 'new-account'
      token: string
      email: string
      fullName: string
      password: string
      acceptTerms: boolean
    }
  | { kind: 'signed-in'; token: string; userId: string; acceptTerms: boolean }

/**
 * Aceitar o convite e já abrir o painel do estabelecimento novo. Conta nova: cria (e-mail confirmado pelo convite),
 * entra com as mesmas credenciais e troca de contexto. Conta existente: aceita e troca de contexto.
 */
export const useAcceptInvitation = () => {
  const signIn = useSignIn()
  const switchContext = useSwitchContext()

  return useServiceMutation({
    service: async (input: AcceptInput) => {
      let userId: string
      let accepted

      if (input.kind === 'new-account') {
        accepted = await invitationService.acceptWithNewAccount({
          token: input.token,
          fullName: input.fullName,
          password: input.password,
          acceptTerms: input.acceptTerms,
        })
        await signIn.mutateAsync({ email: input.email, password: input.password })
        userId = (await authService.me()).id
      } else {
        accepted = await invitationService.accept(input.token, input.acceptTerms)
        userId = input.userId
      }

      await switchContext.mutateAsync({
        userId,
        business: {
          businessId: accepted.businessId,
          name: accepted.businessName,
          role: accepted.role,
        },
      })

      return accepted
    },
  })
}
