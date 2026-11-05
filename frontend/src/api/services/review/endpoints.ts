export const reviewEndpoints = {
  /** GET (a minha), POST (avaliar) e PUT (editar uma vez): consumidor com conta. */
  ofAppointment: (appointmentId: string) =>
    `/api/appointments/${encodeURIComponent(appointmentId)}/review`,
  mine: '/api/reviews/mine',
  /** Do dono: lista e denúncia. */
  owner: '/api/businesses/current/reviews',
  report: (reviewId: string) =>
    `/api/businesses/current/reviews/${encodeURIComponent(reviewId)}/report`,
  /** Do Admin. */
  admin: {
    list: '/api/admin/reviews',
    hide: (reviewId: string) => `/api/admin/reviews/${encodeURIComponent(reviewId)}/hide`,
    unhide: (reviewId: string) => `/api/admin/reviews/${encodeURIComponent(reviewId)}/unhide`,
    dismiss: (reviewId: string) =>
      `/api/admin/reviews/${encodeURIComponent(reviewId)}/dismiss-report`,
  },
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
