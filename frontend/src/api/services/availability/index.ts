import type { AvailabilityCalendarResponse, AvailableSlotsResponse } from '@api/models'
import type { CalendarParams, DayParams } from './types'

import { availabilityEndpoints } from './endpoints'
import { request } from '@api/base'

export const availabilityService = {
  calendar: (businessId: string, params: CalendarParams, signal?: AbortSignal) =>
    request<AvailabilityCalendarResponse>({
      url: availabilityEndpoints.calendar(businessId),
      params,
      signal,
    }),
  day: (businessId: string, params: DayParams, signal?: AbortSignal) =>
    request<AvailableSlotsResponse>({ url: availabilityEndpoints.day(businessId), params, signal }),
}
