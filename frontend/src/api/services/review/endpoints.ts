export const reviewEndpoints = {
  /** GET (a minha), POST (avaliar) e PUT (editar uma vez): consumidor com conta. */
  ofAppointment: (appointmentId: string) =>
    `/api/appointments/${encodeURIComponent(appointmentId)}/review`,
  mine: '/api/reviews/mine',
  /** Anônimas: vitrine. */
  businessReviews: (businessId: string) =>
    `/api/businesses/${encodeURIComponent(businessId)}/reviews`,
  businessRating: (businessId: string) =>
    `/api/businesses/${encodeURIComponent(businessId)}/rating`,
  professionalReviews: (professionalId: string) =>
    `/api/professionals/${encodeURIComponent(professionalId)}/reviews`,
  professionalRating: (professionalId: string) =>
    `/api/professionals/${encodeURIComponent(professionalId)}/rating`,
}
