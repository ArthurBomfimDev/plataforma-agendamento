import type { AppointmentResponse, CounterAppointmentRequest } from '@api/models'
import type { PanelActionVariables, PanelBusiness } from './types'
import { useService, useServiceMutation } from '@api/base'

import type { BusinessContext } from '@store/session/types'
import { businessService } from '../business'
import { panelService } from '.'
import { queryKeys } from '../query-keys'
import { useQueries } from '@tanstack/react-query'

/** A agenda e os pedidos se atualizam sozinhos neste intervalo, sem recarregar a página. */
export const PANEL_REFRESH_MS = 30_000

export const usePanelBusiness = (context: BusinessContext) =>
  useService({
    queryKey: queryKeys.panelBusiness(context.businessId),
    // O detalhe completo é só do dono; o profissional lê a vitrine, que tem o fuso e o prazo.
    service: async (signal): Promise<PanelBusiness> => {
      if (context.role === 'Owner') {
        const { name, category, logo, policy } = await panelService.business(signal)
        return {
          name,
          category,
          logo,
          timeZone: policy.timeZone,
          pendingExpirationHours: policy.pendingExpirationHours,
          autoConfirm: policy.autoConfirm,
        }
      }
      const business = await businessService.get(context.businessId, signal)
      return {
        name: business.name,
        category: business.category,
        logo: business.logo,
        timeZone: business.timeZone,
        pendingExpirationHours: business.pendingExpirationHours,
        autoConfirm: business.autoConfirm,
      }
    },
  })

const teamQuery = (businessId: string) => ({
  queryKey: queryKeys.panelProfessionals(businessId),
  service: async (signal: AbortSignal) => (await panelService.professionals(signal)).items,
})

/** Equipe ativa: quem aparece na agenda e no balcão. */
export const usePanelProfessionals = (businessId: string) =>
  useService({
    ...teamQuery(businessId),
    select: (professionals) => professionals.filter(({ isActive }) => isActive),
  })

/** Equipe inteira, com quem foi desativado: a tela de Profissionais. Mesmo cache da equipe ativa. */
export const usePanelTeam = (businessId: string) => useService(teamQuery(businessId))

/** Detalhe do estabelecimento para as telas de gestão (só o dono). */
export const usePanelBusinessDetail = (businessId: string) =>
  useService({
    queryKey: queryKeys.panelBusinessDetail(businessId),
    service: panelService.business,
  })

export const usePanelWorkSchedules = (businessId: string, professionalIds: string[]) =>
  useQueries({
    queries: professionalIds.map((professionalId) => ({
      queryKey: queryKeys.panelSchedules(businessId, professionalId),
      queryFn: async ({ signal }: { signal: AbortSignal }) =>
        (await panelService.workSchedules(professionalId, signal)).items,
    })),
  })

export const usePanelAgenda = (businessId: string, date: string) =>
  useService({
    queryKey: queryKeys.panelAgenda(businessId, date),
    service: async (signal) => (await panelService.agenda(date, signal)).items,
    refetchInterval: PANEL_REFRESH_MS,
  })

/**
 * Agenda de um período (semana ou mês, Onda 7CF). A API devolve até 100 por página; aqui busca as páginas até
 * completar, com teto de 10 (1.000 agendamentos), que um mês de um estabelecimento pequeno não alcança.
 */
export const usePanelAgendaRange = (
  businessId: string,
  from: string,
  to: string,
  enabled: boolean,
) =>
  useService({
    queryKey: queryKeys.panelAgendaRange(businessId, from, to),
    service: async (signal) => {
      const items: AppointmentResponse[] = []
      for (let page = 1; page <= 10; page++) {
        const result = await panelService.agendaRange(from, to, page, signal)
        items.push(...result.items)
        if (items.length >= result.totalCount || result.items.length === 0) break
      }
      return items
    },
    enabled,
    refetchInterval: PANEL_REFRESH_MS,
  })

export const usePanelPending = (businessId: string) =>
  useService({
    queryKey: queryKeys.panelPending(businessId),
    service: panelService.pending,
    refetchInterval: PANEL_REFRESH_MS,
  })

export const usePanelServices = (businessId: string, enabled: boolean) =>
  useService({
    queryKey: queryKeys.panelServices(businessId),
    service: async (signal) => (await panelService.services(signal)).items,
    enabled,
  })

/**
 * Uma escrita no painel. Depois dela (também no erro: um 409 quer dizer que a tela está velha), o painel inteiro
 * do estabelecimento é buscado de novo — catálogo, equipe e jornada alimentam a agenda e o balcão.
 */
export const usePanelMutation = <TVariables, TResult>(
  businessId: string,
  service: (variables: TVariables) => Promise<TResult>,
) =>
  useServiceMutation({
    service,
    invalidates: [queryKeys.panel(businessId)],
    invalidateOn: 'settled',
  })

/** Uma ação sobre um agendamento. Depois dela, agenda e pedidos são buscados de novo. */
export const usePanelAction = (businessId: string) =>
  usePanelMutation(businessId, ({ action, appointmentId }: PanelActionVariables) =>
    panelService.act(action, appointmentId),
  )

export const useCounterBooking = (businessId: string) =>
  usePanelMutation(businessId, (request: CounterAppointmentRequest) =>
    panelService.counter(request),
  )
