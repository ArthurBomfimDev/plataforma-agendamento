/** Parâmetros de `GET /api/businesses/search`. */
export type SearchBusinessesParams = {
  latitude: number
  longitude: number
  radiusKm?: number
  /** Só a cidade (Onda 7C): o backend ignora o raio e compara sem acento, até 50 km do ponto. */
  city?: string
  term?: string
  category?: string
  maxPriceCents?: number
  sortBy?: string
}
