import type {
  AppointmentResponse,
  BusinessDetailResponse,
  CounterAppointmentRequest,
  PagedResult,
  ProfessionalResponse,
  ServiceResponse,
  WorkScheduleResponse,
} from '@api/models'

import type { PanelAction } from './types'
import { authRequest } from '@api/base'
import { panelEndpoints } from './endpoints'

/** Caminho de cada ação sobre um agendamento. */
const ACTION_PATHS: Record<PanelAction, string> = {
  confirm: 'confirm',
  reject: 'reject',
  cancel: 'cancel',
  complete: 'complete',
  noShow: 'no-show',
}

const list = <T>(url: string, params: Record<string, unknown>, signal?: AbortSignal) =>
  authRequest<PagedResult<T>>({ url, params, signal })

export const panelService = {
  /** Só o dono. */
  business: (signal?: AbortSignal) =>
    authRequest<BusinessDetailResponse>({ url: panelEndpoints.business, signal }),
  professionals: (signal?: AbortSignal) =>
    list<ProfessionalResponse>(panelEndpoints.professionals, { pageSize: 50 }, signal),
  workSchedules: (professionalId: string, signal?: AbortSignal) =>
    list<WorkScheduleResponse>(
      panelEndpoints.workSchedules,
      { professionalId, pageSize: 50 },
      signal,
    ),
  agenda: (date: string, signal?: AbortSignal) =>
    list<AppointmentResponse>(panelEndpoints.appointments, { date, pageSize: 100 }, signal),
  /** Semana e mês (7CF): de `date` a `to`, inclusivo, até 42 dias. */
  agendaRange: (from: string, to: string, page: number, signal?: AbortSignal) =>
    list<AppointmentResponse>(
      panelEndpoints.appointments,
      { date: from, to, page, pageSize: 100 },
      signal,
    ),
  pending: (signal?: AbortSignal) =>
    list<AppointmentResponse>(panelEndpoints.pending, { pageSize: 50 }, signal),
  /** `reject` e `cancel` levam motivo; as outras ações não têm corpo. */
  act: (action: PanelAction, appointmentId: string, reason: string | null = null) =>
    authRequest<AppointmentResponse>({
      method: 'POST',
      url: panelEndpoints.appointmentAction(appointmentId, ACTION_PATHS[action]),
      data: action === 'reject' || action === 'cancel' ? { reason } : undefined,
    }),
  counter: (request: CounterAppointmentRequest) =>
    authRequest<AppointmentResponse>({
      method: 'POST',
      url: panelEndpoints.counter,
      data: request,
    }),
  /** Serviços do catálogo, ativos e inativos: a marcação de balcão e a tela de Serviços. */
  services: (signal?: AbortSignal) =>
    list<ServiceResponse>(panelEndpoints.services, { pageSize: 50 }, signal),
}
