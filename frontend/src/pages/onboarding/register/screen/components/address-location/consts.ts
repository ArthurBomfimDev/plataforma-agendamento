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

/**
 * As consultas, da mais específica para a menos: rua, número e cidade, sem o bairro (o provedor conhece o bairro com outro
 * nome em cidade pequena, e o bairro na consulta fazia o número não ser achado); depois com o bairro; só a rua; só o bairro;
 * por fim o centro do município. A medição de 10/11 contra cinco endereços de Garça está em
 * `docs/produto/limitacoes-e-trabalho-futuro.md`. Em 11/11, Duartina/SP (CEP 17471-318) mostrou o outro lado: o ViaCEP acha a
 * rua, mas o OpenStreetMap só conhece o município, e a escada antiga terminava em "não encontrado" sem saída. O município
 * sempre existe; o dono vê o aviso de ponto aproximado e decide.
 */
export const addressQueries = (address: AddressValues) => {
  const street = address.street.trim()
  const place = `${address.city.trim()}, ${address.state.trim().toUpperCase()}`
  const join = (...parts: string[]) => parts.filter(Boolean).join(', ')
  const number = address.streetNumber.trim()
  const district = address.district.trim()

  return [
    ...new Set([
      join(street, number, place),
      join(street, number, district, place),
      join(street, place),
      join(district, place),
      place,
    ]),
  ]
}

/** Ponto de bairro ou de município: serve para a busca por distância, mas o dono precisa saber que não é o endereço. */
export const isApproximate = ({ precision }: GeoPlaceResponse) =>
  PRECISION_RANK[precision] >= PRECISION_RANK.Locality

export const APPROXIMATE_WARNING =
  'Só achamos o bairro ou a cidade, não a rua. O ponto é aproximado: ele define a distância que aparece na busca. Confirme assim ou corrija o endereço.'

/** Só o que tem coordenada, o mais preciso primeiro. No empate, fica a ordem do provedor. */
export const bestPlaces = (places: GeoPlaceResponse[]) =>
  places
    .filter(({ latitude, longitude }) => Number.isFinite(latitude) && Number.isFinite(longitude))
    .toSorted((a, b) => PRECISION_RANK[a.precision] - PRECISION_RANK[b.precision])

/**
 * Busca o endereço. Para na primeira consulta que acha um ponto exato ou na rua; se só acha o bairro ou a cidade, tenta as
 * próximas consultas e fica com o resultado mais preciso de todos, para uma consulta mais frouxa nunca esconder uma melhor.
 * Vazio: não achou. Falha de rede sobe para quem chamou.
 */
export const locateAddress = async (
  address: AddressValues,
  search: (text: string) => Promise<GeoPlaceResponse[]>,
) => {
  let best: GeoPlaceResponse[] = []
  for (const query of addressQueries(address)) {
    const places = bestPlaces(await search(query))
    const top = places[0]
    if (!top) continue
    if (PRECISION_RANK[top.precision] <= PRECISION_RANK.Street) return places
    if (!best[0] || PRECISION_RANK[top.precision] < PRECISION_RANK[best[0].precision]) best = places
  }
  return best
}

/** Abre o ponto num mapa fora do app. A CSP do site não deixa embutir mapa de terceiro. */
export const mapLink = ({ latitude, longitude }: GeoPlaceResponse) =>
  `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`
