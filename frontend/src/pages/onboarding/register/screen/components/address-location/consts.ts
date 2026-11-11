import type { GeoPlaceResponse, LocationPrecision } from '@api/models'

import type { AddressValues } from '../../types'

export const LOCATION_NOT_FOUND = 'Não foi possível localizar o endereço. Confira os dados.'

/** O que aconteceu com a busca do endereço. `idle`: ainda no formulário. */
export type LocationCheck =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'found'; places: GeoPlaceResponse[] }
  | { status: 'not-found' }
  | { status: 'error'; message: string }

const PRECISION_RANK: Record<LocationPrecision, number> = {
  Rooftop: 0,
  Street: 1,
  Locality: 2,
  City: 3,
}

export const PRECISION_LABELS: Record<LocationPrecision, string> = {
  Rooftop: 'Ponto exato',
  Street: 'Na rua',
  Locality: 'No bairro',
  City: 'Na cidade',
}

/** Primeiro o endereço completo; o bairro e o número atrapalham a busca em cidade pequena, então há uma segunda tentativa. */
export const addressQueries = (address: AddressValues) => {
  const street = address.street.trim()
  const place = `${address.city.trim()}, ${address.state.trim().toUpperCase()}`
  const full = [street, address.streetNumber.trim(), address.district.trim(), place]
    .filter(Boolean)
    .join(', ')
  return [...new Set([full, `${street}, ${place}`])]
}

/** Só o que tem coordenada, o mais preciso primeiro. No empate, fica a ordem do provedor. */
export const bestPlaces = (places: GeoPlaceResponse[]) =>
  places
    .filter(({ latitude, longitude }) => Number.isFinite(latitude) && Number.isFinite(longitude))
    .toSorted((a, b) => PRECISION_RANK[a.precision] - PRECISION_RANK[b.precision])

/** Busca o endereço e para na primeira tentativa que achar algo. Vazio: não achou. Falha de rede sobe para quem chamou. */
export const locateAddress = async (
  address: AddressValues,
  search: (text: string) => Promise<GeoPlaceResponse[]>,
) => {
  for (const query of addressQueries(address)) {
    const places = bestPlaces(await search(query))
    if (places.length > 0) return places
  }
  return []
}

/** Abre o ponto num mapa fora do app. A CSP do site não deixa embutir mapa de terceiro. */
export const mapLink = ({ latitude, longitude }: GeoPlaceResponse) =>
  `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`
