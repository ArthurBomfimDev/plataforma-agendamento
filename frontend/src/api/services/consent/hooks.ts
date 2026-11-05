import { useService, useServiceMutation } from '@api/base'

import { consentService } from '.'
import { queryKeys } from '../query-keys'
import { useSessionStore } from '@store/session'

/** Versão vigente e texto. Só busca quando a tela vai mostrar. */
export const useConsentVersions = (enabled: boolean) =>
  useService({
    queryKey: queryKeys.consentVersions,
    service: (signal) => consentService.versions(signal),
    enabled,
  })

export const useMyConsents = () =>
  useService({
    queryKey: queryKeys.consents,
    service: async (signal) => (await consentService.mine(signal)).items,
    enabled: useSessionStore((state) => state.session !== null),
  })

export const useGrantConsent = () =>
  useServiceMutation({
    service: ({ purpose, version }: { purpose: string; version: string }) =>
      consentService.grant(purpose, version),
    invalidates: [queryKeys.consents],
  })

export const useRevokeConsent = () =>
  useServiceMutation({ service: consentService.revoke, invalidates: [queryKeys.consents] })
