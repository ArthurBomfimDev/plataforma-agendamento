export type MapPoint = { latitude: number; longitude: number }

export type NudgeDirection = 'north' | 'south' | 'east' | 'west'

/** Passo dos botões de ajuste fino: o pino anda 10 m por toque. */
export const NUDGE_METERS = 10

const METERS_PER_DEGREE = 111_320

/** Mapa de ruas do OpenStreetMap, o mesmo da busca de endereço. A atribuição é exigência da licença dos dados. */
export const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
export const TILE_ATTRIBUTION = '© OpenStreetMap'

/** Aproximação de rua: cabe numa quadra, onde o dono arrasta o pino. */
export const DEFAULT_ZOOM = 17
export const MAX_ZOOM = 19

export const NUDGE_LABELS: Record<NudgeDirection, string> = {
  north: 'Mover o pino para o norte',
  south: 'Mover o pino para o sul',
  east: 'Mover o pino para o leste',
  west: 'Mover o pino para o oeste',
}

export const isValidPoint = ({ latitude, longitude }: MapPoint) =>
  Number.isFinite(latitude) &&
  Number.isFinite(longitude) &&
  Math.abs(latitude) <= 90 &&
  Math.abs(longitude) <= 180

/** Anda `meters` na direção pedida. O grau de longitude encolhe com a latitude, então a conta usa o cosseno dela. */
export const nudge = (
  point: MapPoint,
  direction: NudgeDirection,
  meters = NUDGE_METERS,
): MapPoint => {
  const latitudeStep = meters / METERS_PER_DEGREE
  const longitudeStep = meters / (METERS_PER_DEGREE * Math.cos((point.latitude * Math.PI) / 180))

  switch (direction) {
    case 'north':
      return { ...point, latitude: point.latitude + latitudeStep }
    case 'south':
      return { ...point, latitude: point.latitude - latitudeStep }
    case 'east':
      return { ...point, longitude: point.longitude + longitudeStep }
    case 'west':
      return { ...point, longitude: point.longitude - longitudeStep }
  }
}

/** Distância em metros entre dois pontos (haversine), para avisar quando o pino saiu longe do que a busca achou. */
export const distanceMeters = (a: MapPoint, b: MapPoint) => {
  const radians = (degrees: number) => (degrees * Math.PI) / 180
  const dLat = radians(b.latitude - a.latitude)
  const dLng = radians(b.longitude - a.longitude)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(dLng / 2) ** 2
  return 2 * 6_371_000 * Math.asin(Math.sqrt(h))
}

/** Acima disto o aviso aparece: o pino está longe do endereço que o dono digitou. */
export const FAR_FROM_SEARCH_METERS = 500

export const FAR_WARNING =
  'O pino está longe do endereço digitado. Confira se é mesmo aqui antes de confirmar.'

export const MAP_HELP =
  'Arraste o pino ou toque no mapa para ajustar. Este ponto define a distância na busca.'
