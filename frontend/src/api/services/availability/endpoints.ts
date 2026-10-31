import { businessEndpoints } from '../business/endpoints'

export const availabilityEndpoints = {
  day: (businessId: string) => `${businessEndpoints.business(businessId)}/availability`,
  calendar: (businessId: string) =>
    `${businessEndpoints.business(businessId)}/availability/calendar`,
}
