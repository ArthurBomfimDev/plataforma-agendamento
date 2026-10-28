import type { PostalCodeResponse } from '@lib/api/types'

/** `17400000` ou `17400-0` → `17400-000`/`17400-0`, enquanto a pessoa digita. Só dígitos, no máximo 8. */
export const formatPostalCode = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits
}

export const postalCodeDigits = (value: string) => value.replace(/\D/g, '')

/** O rótulo da referência vinda do CEP: o bairro e a cidade, ou a cidade e a UF. */
export const postalCodeLabel = (address: PostalCodeResponse) =>
  address.district ? `${address.district}, ${address.city}` : `${address.city}, ${address.state}`

/**
 * Textos para achar o ponto do CEP, do mais preciso ao mais largo: o CEP não traz coordenada, então o ponto vem
 * da busca por endereço. Sem logradouro (CEP geral), começa pelo bairro ou pela cidade.
 */
export const postalCodeQueries = (address: PostalCodeResponse) => {
  const cityState = `${address.city} - ${address.state}`
  return [
    address.street && [address.street, address.district, cityState].filter(Boolean).join(', '),
    address.district && `${address.district}, ${cityState}`,
    cityState,
  ].filter((text): text is string => Boolean(text))
}

/** `1500` → `1,5 km`; `800` → `800 m`. */
export const formatDistance = (meters: number) =>
  meters >= 1_000
    ? `${(meters / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`
    : `${Math.round(meters)} m`
