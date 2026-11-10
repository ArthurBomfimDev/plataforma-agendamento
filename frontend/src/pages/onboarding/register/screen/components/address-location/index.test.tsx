import { describe, expect, it, vi } from 'vitest'
import { LOCATION_NOT_FOUND, addressQueries, bestPlaces, locateAddress, mapLink } from './consts'

import { AddressLocation, type AddressLocationProps } from '.'
import type { GeoPlaceResponse } from '@api/models'
import { renderToString } from 'react-dom/server'

const noop = () => undefined

const render = (check: AddressLocationProps['check'], error?: string) =>
  renderToString(
    <AddressLocation
      check={check}
      busy={false}
      error={error}
      onConfirm={noop}
      onRetry={noop}
      onEdit={noop}
    />,
  ).replaceAll('<!-- -->', '')

const place = (patch: Partial<GeoPlaceResponse> = {}): GeoPlaceResponse => ({
  label: 'Rua das Flores, 10, Garça, SP',
  latitude: -22.2125,
  longitude: -49.6564,
  precision: 'Street',
  ...patch,
})

const address = {
  postalCode: '17400-000',
  street: 'Rua das Flores',
  streetNumber: '10',
  district: 'Centro',
  city: 'Garça',
  state: 'sp',
}

describe('AddressLocation', () => {
  it('carregando: avisa que está procurando e não oferece confirmar', () => {
    const html = render({ status: 'loading' })

    expect(html).toContain('role="status"')
    expect(html).toContain('Procurando o endereço')
    expect(html).not.toContain('Confirmar esta localização')
  })

  it('sucesso: mostra o lugar achado, o link do mapa e pede a confirmação do dono', () => {
    const html = render({ status: 'found', places: [place()] })

    expect(html).toContain('Rua das Flores, 10, Garça, SP')
    expect(html).toContain('Na rua')
    expect(html).toContain('Ver no mapa')
    expect(html).toContain('mlat=-22.2125')
    expect(html).toContain('Confirmar esta localização')
    expect(html).toContain('Corrigir o endereço')
  })

  it('sem resultado: a mensagem certa, como alerta, e o caminho de volta ao formulário', () => {
    const html = render({ status: 'not-found' })

    expect(html).toContain('role="alert"')
    expect(html).toContain(LOCATION_NOT_FOUND)
    expect(html).toContain('Corrigir o endereço')
    expect(html).not.toContain('Confirmar esta localização')
  })

  it('erro de rede: mostra a mensagem e oferece tentar de novo', () => {
    const html = render({ status: 'error', message: 'Sem conexão com o servidor. Tente de novo.' })

    expect(html).toContain('Sem conexão com o servidor')
    expect(html).toContain('Tentar de novo')
    expect(html).not.toContain('Algo deu errado')
  })

  it('erro ao gravar a confirmação aparece junto do botão', () => {
    expect(render({ status: 'found', places: [place()] }, 'Falhou ao gravar.')).toContain(
      'Falhou ao gravar.',
    )
  })
})

describe('busca do endereço', () => {
  // Ordem atualizada em 10/11: sem o bairro primeiro (antes era com o bairro). Medição em `limitacoes-e-trabalho-futuro.md`.
  it('monta as buscas: sem o bairro, com o bairro e só a rua, sem repetir', () => {
    expect(addressQueries(address)).toEqual([
      'Rua das Flores, 10, Garça, SP',
      'Rua das Flores, 10, Centro, Garça, SP',
      'Rua das Flores, Garça, SP',
    ])
  })

  it('sem bairro informado, a busca com bairro não se repete', () => {
    expect(addressQueries({ ...address, district: '' })).toEqual([
      'Rua das Flores, 10, Garça, SP',
      'Rua das Flores, Garça, SP',
    ])
  })

  it('o melhor resultado vem primeiro e o que não tem coordenada sai', () => {
    const ordered = bestPlaces([
      place({ label: 'cidade', precision: 'City' }),
      place({ label: 'sem ponto', latitude: Number.NaN }),
      place({ label: 'exato', precision: 'Rooftop' }),
    ])

    expect(ordered.map(({ label }) => label)).toEqual(['exato', 'cidade'])
  })

  it('tenta a próxima busca quando a anterior não acha nada', async () => {
    // Só a busca com o bairro acha: a primeira (sem o bairro) volta vazia.
    const search = vi.fn(async (text: string) => (text.includes('Centro') ? [place()] : []))

    expect(await locateAddress(address, search)).toHaveLength(1)
    expect(search).toHaveBeenCalledTimes(2)
  })

  it('para na primeira busca que acha o ponto exato ou a rua', async () => {
    const exact = vi.fn(async () => [place({ precision: 'Rooftop' })])
    const street = vi.fn(async () => [place({ precision: 'Street' })])

    expect(await locateAddress(address, exact)).toHaveLength(1)
    expect(exact).toHaveBeenCalledTimes(1)
    await locateAddress(address, street)
    expect(street).toHaveBeenCalledTimes(1)
  })

  it('se a primeira só acha o bairro, continua e fica com o resultado mais preciso', async () => {
    const search = vi.fn(async (text: string) =>
      text.includes('Centro')
        ? [place({ label: 'com bairro', precision: 'Rooftop' })]
        : [place({ label: 'só o bairro', precision: 'Locality' })],
    )

    const found = await locateAddress(address, search)

    expect(found.map(({ label }) => label)).toEqual(['com bairro'])
    expect(search).toHaveBeenCalledTimes(2)
  })

  it('uma busca mais frouxa nunca esconde uma melhor: sem nada mais preciso, fica o bairro', async () => {
    const search = vi.fn(async (text: string) =>
      text === 'Rua das Flores, 10, Garça, SP'
        ? [place({ label: 'bairro', precision: 'Locality' })]
        : [place({ label: 'cidade', precision: 'City' })],
    )

    expect((await locateAddress(address, search))[0]?.label).toBe('bairro')
    expect(search).toHaveBeenCalledTimes(3)
  })

  it('sem resultado em nenhuma: lista vazia, sem erro', async () => {
    expect(await locateAddress(address, async () => [])).toEqual([])
  })

  it('falha de rede sobe para quem chamou mostrar o erro', async () => {
    await expect(
      locateAddress(address, async () => {
        throw new Error('rede')
      }),
    ).rejects.toThrow('rede')
  })

  it('o link leva ao ponto escolhido', () => {
    expect(mapLink(place())).toContain('#map=17/-22.2125/-49.6564')
  })
})
