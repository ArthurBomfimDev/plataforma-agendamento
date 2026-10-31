import type {
  AddScheduleExceptionRequest,
  AffectedAppointmentResponse,
  BusinessDetailResponse,
  CreateProfessionalRequest,
  PagedResult,
  ProfessionalResponse,
  SaveServiceRequest,
  SaveWorkScheduleRequest,
  ScheduleExceptionResponse,
  ServiceResponse,
  UpdateProfessionalRequest,
  UpdateSchedulingPolicyRequest,
  WorkScheduleResponse,
} from '@api/models'
import type { AffectedAppointmentsParams, BusinessImageSlot, UploadProgress } from './types'

import { authRequest } from '@api/base'
import { managementEndpoints } from './endpoints'

/**
 * Envio de imagem (`multipart/form-data`, campo `file`). Adaptador `xhr` nesta chamada: o `fetch` não informa o
 * progresso do envio. O token e a renovação vêm dos interceptors, como em qualquer chamada.
 */
const upload = async <T>(url: string, file: File, onProgress?: UploadProgress) => {
  const form = new FormData()
  form.append('file', file)
  const result = await authRequest<T>({
    method: 'PUT',
    url,
    data: form,
    adapter: 'xhr',
    onUploadProgress: ({ progress }) => progress !== undefined && onProgress?.(progress),
  })
  onProgress?.(1)
  return result
}

/**
 * Gestão do estabelecimento (Onda 7D): catálogo, equipe, jornadas, bloqueios, imagens e política. Toda
 * escrita aqui é só do dono — a API responde 403 `auth.forbidden` ao profissional.
 */
export const managementService = {
  createService: (request: SaveServiceRequest) =>
    authRequest<ServiceResponse>({
      method: 'POST',
      url: managementEndpoints.services,
      data: request,
    }),
  updateService: (serviceId: string, request: SaveServiceRequest) =>
    authRequest<ServiceResponse>({
      method: 'PUT',
      url: managementEndpoints.service(serviceId),
      data: request,
    }),
  /** Habilita o profissional no serviço, com o preço e a duração do serviço. */
  enableProfessional: (serviceId: string, professionalId: string) =>
    authRequest<ServiceResponse>({
      method: 'PUT',
      url: managementEndpoints.serviceProfessional(serviceId, professionalId),
      data: { priceOverrideCents: null, durationOverrideMinutes: null },
    }),
  disableProfessional: (serviceId: string, professionalId: string) =>
    authRequest<void>({
      method: 'DELETE',
      url: managementEndpoints.serviceProfessional(serviceId, professionalId),
    }),
  createProfessional: (request: CreateProfessionalRequest) =>
    authRequest<ProfessionalResponse>({
      method: 'POST',
      url: managementEndpoints.professionals,
      data: request,
    }),
  updateProfessional: (professionalId: string, request: UpdateProfessionalRequest) =>
    authRequest<ProfessionalResponse>({
      method: 'PUT',
      url: managementEndpoints.professional(professionalId),
      data: request,
    }),
  addWorkSchedule: (professionalId: string, request: SaveWorkScheduleRequest) =>
    authRequest<WorkScheduleResponse>({
      method: 'POST',
      url: managementEndpoints.workSchedules,
      data: { professionalId, ...request },
    }),
  updateWorkSchedule: (scheduleId: string, request: SaveWorkScheduleRequest) =>
    authRequest<WorkScheduleResponse>({
      method: 'PUT',
      url: managementEndpoints.workSchedule(scheduleId),
      data: request,
    }),
  removeWorkSchedule: (scheduleId: string) =>
    authRequest<void>({ method: 'DELETE', url: managementEndpoints.workSchedule(scheduleId) }),
  /** Bloqueios que ainda não terminaram, do mais próximo ao mais distante. */
  exceptions: (signal?: AbortSignal) =>
    authRequest<PagedResult<ScheduleExceptionResponse>>({
      url: managementEndpoints.exceptions,
      params: { pageSize: 50 },
      signal,
    }),
  affectedAppointments: ({ startsAt, endsAt, professionalId }: AffectedAppointmentsParams) =>
    authRequest<PagedResult<AffectedAppointmentResponse>>({
      url: managementEndpoints.affectedAppointments,
      params: { startsAt, endsAt, professionalId: professionalId ?? undefined, pageSize: 50 },
    }),
  addException: (request: AddScheduleExceptionRequest) =>
    authRequest<ScheduleExceptionResponse>({
      method: 'POST',
      url: managementEndpoints.exceptions,
      data: request,
    }),
  removeException: (exceptionId: string) =>
    authRequest<void>({ method: 'DELETE', url: managementEndpoints.exception(exceptionId) }),
  updatePolicy: (request: UpdateSchedulingPolicyRequest) =>
    authRequest<BusinessDetailResponse>({
      method: 'PUT',
      url: managementEndpoints.policy,
      data: request,
    }),
  uploadBusinessImage: (slot: BusinessImageSlot, file: File, onProgress?: UploadProgress) =>
    upload<BusinessDetailResponse>(managementEndpoints.businessImage(slot), file, onProgress),
  removeBusinessImage: (slot: BusinessImageSlot) =>
    authRequest<BusinessDetailResponse>({
      method: 'DELETE',
      url: managementEndpoints.businessImage(slot),
    }),
  uploadProfessionalPhoto: (professionalId: string, file: File, onProgress?: UploadProgress) =>
    upload<ProfessionalResponse>(
      managementEndpoints.professionalPhoto(professionalId),
      file,
      onProgress,
    ),
  removeProfessionalPhoto: (professionalId: string) =>
    authRequest<ProfessionalResponse>({
      method: 'DELETE',
      url: managementEndpoints.professionalPhoto(professionalId),
    }),
}
