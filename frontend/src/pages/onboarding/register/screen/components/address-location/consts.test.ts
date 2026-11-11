import { addressQueries, isApproximate, locateAddress } from './consts'
import { describe, expect, it, vi } from 'vitest'

import type { AddressValues } from '../../types'
import type { GeoPlaceResponse } from '@api/models'

/** Duartina/SP, CEP 17471-318: o ViaCEP acha a rua, mas o OpenStreetMap só conhece o município. */
const DUARTINA: AddressValues = {
  postalCode: '17471-318',
  street: 'Avenida Doutor Gil Borges',
  streetNumber: '100',
  district: 'Vila Salomão Sabbag',
  city: 'Duartina',
  state: 'SP',
}

const place = (precision: GeoPlaceResponse['precision'], label: string): GeoPlaceResponse => ({
  label,
  latitude: -22.41456,
  longitude: -49.408355,
  precision,
  city: 'Duartina',
  state: 'SP',
})

describe('addressQueries', () => {
  it('desce do endereço completo ao centro do município, na ordem, sem repetir', () => {
    expect(addressQueries(DUARTINA)).toEqual([
      'Avenida Doutor Gil Borges, 100, Duartina, SP',
      'Avenida Doutor Gil Borges, 100, Vila Salomão Sabbag, Duartina, SP',
      'Avenida Doutor Gil Borges, Duartina, SP',
      'Vila Salomão Sabbag, Duartina, SP',
      'Duartina, SP',
    ])
  })

  it('sem rua nem bairro (CEP geral), vai direto à cidade', () => {
    expect(addressQueries({ ...DUARTINA, street: '', streetNumber: '', district: '' })).toEqual([
      'Duartina, SP',
    ])
  })
})

describe('locateAddress em cidade pequena', () => {
  it('Duartina: rua e bairro não existem no mapa, o centro do município resolve', async () => {
    const search = vi.fn(async (text: string) =>
      text === 'Duartina, SP' ? [place('City', 'Duartina, SP')] : [],
    )

    const places = await locateAddress(DUARTINA, search)

    expect(places).toHaveLength(1)
    expect(places[0]!.precision).toBe('City')
    expect(search).toHaveBeenCalledTimes(5)
    expect(isApproximate(places[0]!)).toBe(true)
  })

  it('para na primeira consulta que acha a rua', async () => {
    const search = vi.fn(async () => [place('Street', 'Rua X - Centro, Garça - SP')])

    const places = await locateAddress(DUARTINA, search)

    expect(places[0]!.precision).toBe('Street')
    expect(search).toHaveBeenCalledTimes(1)
    expect(isApproximate(places[0]!)).toBe(false)
  })

  it('o bairro só vence se nenhuma consulta mais específica achar a rua', async () => {
    const search = vi.fn(async (text: string) =>
      text.startsWith('Vila Salomão Sabbag,')
        ? [place('Locality', 'Vila Salomão Sabbag, Duartina')]
        : [],
    )

    const places = await locateAddress(DUARTINA, search)

    expect(places[0]!.precision).toBe('Locality')
    expect(isApproximate(places[0]!)).toBe(true)
  })

  it('provedor fora do ar: o erro sobe para a tela mostrar a mensagem certa', async () => {
    const search = vi.fn(async () => {
      throw new Error('geo.provider_unavailable')
    })

    await expect(locateAddress(DUARTINA, search)).rejects.toThrow('geo.provider_unavailable')
  })

  it('nada em lugar nenhum devolve vazio', async () => {
    expect(await locateAddress(DUARTINA, async () => [])).toEqual([])
  })
})
