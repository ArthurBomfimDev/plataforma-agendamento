import { ACCOUNT_SCOPED_KEYS, queryKeys } from '../query-keys'
import { ApiError, useService, useServiceMutation } from '@api/base'
import {
  type Entry,
  type EntryIntent,
  chooseEntry,
  forgetContexts,
  readLastContext,
  rememberContext,
} from './context'
import { type QueryClient, useQueryClient } from '@tanstack/react-query'
import { clearPendingProfile, readPendingProfile, savePendingProfile } from './pending-profile'

import type { UserBusinessResponse } from '@api/models'
import { authService } from '.'
import { customerService } from '../customer'
import { useSessionStore } from '@store/session'

/** Tira do cache tudo o que era da conta anterior. */
const clearAccountCache = (queryClient: QueryClient) =>
  ACCOUNT_SCOPED_KEYS.forEach((queryKey) => queryClient.removeQueries({ queryKey }))

const useSignedIn = () => useSessionStore((state) => state.session !== null)

export const useMe = () =>
  useService({ queryKey: queryKeys.me, service: authService.me, enabled: useSignedIn() })

/** Contexto de estabelecimento ativo, ou `null` no de consumidor. */
export const useBusinessContext = () => useSessionStore((state) => state.context)

/**
 * Entrar: guarda a sessão e limpa o cache de quem estava antes. Na primeira entrada depois do
 * cadastro, cria o perfil de consumidor guardado no cadastro (ver `pending-profile`).
 */
export const useSignIn = () => {
  const queryClient = useQueryClient()
  return useServiceMutation({
    service: async ({ email, password }: { email: string; password: string }) => {
      const auth = await authService.login(email, password)
      clearAccountCache(queryClient)
      useSessionStore.getState().setSession(auth)
      // Sessão nova começa como consumidor; o contexto de quem estava antes não vale para ela.
      useSessionStore.getState().setContext(auth.accessToken, auth.accessTokenExpiresAt, null)

      const birthDate = readPendingProfile(email)
      if (birthDate) {
        try {
          await customerService.register(birthDate)
        } catch (error) {
          // Perfil já criado (outra aba, outra tentativa): segue. Outro erro não impede a entrada;
          // o agendamento pede o perfil depois, com mensagem própria.
          if (!(error instanceof ApiError) || error.code !== 'customer.already_registered') {
            return auth
          }
        }
        clearPendingProfile()
      }

      return auth
    },
  })
}

/**
 * Criar conta de consumidor. Desde a Onda 6A, o cadastro não abre sessão: a conta só entra depois de
 * confirmar o e-mail. A data de nascimento fica guardada para criar o perfil na primeira entrada.
 */
export const useSignUp = () =>
  useServiceMutation({
    service: async (values: {
      fullName: string
      email: string
      password: string
      birthDate: string
    }) => {
      await authService.register(values.email, values.password, values.fullName)
      savePendingProfile(values.email, values.birthDate)
    },
  })

export const useConfirmEmail = () => useServiceMutation({ service: authService.confirmEmail })

export const useResendConfirmation = () =>
  useServiceMutation({ service: authService.resendConfirmation })

export const useForgotPassword = () => useServiceMutation({ service: authService.forgotPassword })

export const useResetPassword = () =>
  useServiceMutation({
    service: ({ token, newPassword }: { token: string; newPassword: string }) =>
      authService.resetPassword(token, newPassword),
  })

/**
 * Troca o contexto: painel de um estabelecimento ou consumidor (`null`). Guarda o novo token e lembra
 * a escolha para a próxima entrada.
 */
export const useSwitchContext = () => {
  const queryClient = useQueryClient()
  return useServiceMutation({
    service: async ({
      userId,
      business,
    }: {
      userId: string
      business: UserBusinessResponse | null
    }) => {
      const token = await authService.switchContext(business?.businessId ?? null)
      useSessionStore.getState().setContext(
        token.accessToken,
        token.accessTokenExpiresAt,
        business && {
          businessId: business.businessId,
          businessName: business.name,
          role: business.role,
        },
      )
      rememberContext(userId, business?.businessId ?? null)
      queryClient.removeQueries({ queryKey: queryKeys.allPanels })
      return token
    },
  })
}

/**
 * Depois de entrar: lê os contextos da conta, decide onde ela entra (`chooseEntry`) e, se for um
 * painel, já troca o token.
 */
export const useEnterAccount = () => {
  const queryClient = useQueryClient()
  const switchContext = useSwitchContext()
  return useServiceMutation({
    service: async (intent: EntryIntent): Promise<Entry> => {
      const me = await queryClient.fetchQuery({
        queryKey: queryKeys.me,
        queryFn: ({ signal }) => authService.me(signal),
      })
      const entry = chooseEntry(me, readLastContext(me.id), intent)
      if (entry.kind === 'business') {
        await switchContext.mutateAsync({ userId: me.id, business: entry.business })
      }
      return entry
    },
  })
}

/** "Minha conta" (7CF): troca o nome e recarrega a conta (o menu mostra o nome novo). */
export const useUpdateMe = () =>
  useServiceMutation({
    service: authService.updateMe,
    invalidates: [queryKeys.me],
    invalidateOn: 'settled',
  })

/**
 * Troca a senha. A API devolve uma sessão nova (de consumidor) e encerra as outras: guarda a nova e, se o painel
 * estava aberto, pede o contexto de novo, como depois de uma renovação.
 */
export const useChangePassword = () =>
  useServiceMutation({
    service: async ({ current, next }: { current: string; next: string }) => {
      const session = await authService.changePassword(current, next)
      const store = useSessionStore.getState()
      const context = store.context
      store.setSession(session)
      if (context) {
        const token = await authService.switchContext(context.businessId)
        useSessionStore
          .getState()
          .setContext(token.accessToken, token.accessTokenExpiresAt, context)
      }
    },
  })

export const useSignOut = () => {
  const queryClient = useQueryClient()
  return () => {
    const session = useSessionStore.getState().session
    useSessionStore.getState().signOut()
    forgetContexts()
    clearAccountCache(queryClient)
    // Revoga o refresh token no servidor; se falhar, a sessão local já foi encerrada.
    if (session) void authService.logout(session.refreshToken).catch(() => undefined)
  }
}
