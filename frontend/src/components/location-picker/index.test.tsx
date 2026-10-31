import { describe, expect, it } from 'vitest'
import { formatDistance, formatPostalCode, postalCodeLabel, postalCodeQueries } from './consts'

import { DEMO_LOCATION } from '@lib/zustand/location'
import { LocationPickerPanel } from './panel'
import type { LocationPickerPanelProps } from './types'
import { renderToString } from 'react-dom/server'

const html = (props: LocationPickerPanelProps) =>
  renderToString(<LocationPickerPanel {...props} />).replaceAll('<!-- -->', '')

describe('LocationPickerPanel', () => {
  it('menu: os três caminhos e a opção da demonstração', () => {
    const page = html({ step: 'menu', current: null })

    expect(page).toContain('Usar minha localização')
    expect(page).toContain('Buscar por CEP')
    expect(page).toContain('Endereço, bairro ou cidade')
    expect(page).toContain('Garça, SP (demonstração)')
  })

  it('menu com referência: mostra o que vai trocar', () => {
    const page = html({
      step: 'menu',
      current: { label: 'Centro, Garça', latitude: -22.216, longitude: -49.655, source: 'search' },
    })

    expect(page).toContain('Centro, Garça')
  })

  it('menu: a distância da busca mora aqui, com Cidade (a do endereço) e os raios (7CF)', () => {
    const page = html({
      step: 'menu',
      current: { ...DEMO_LOCATION },
      distance: 'city',
      onDistance: () => undefined,
    })
    const group = page.match(/aria-label="Distância da busca".*?<\/div><\/div>/s)![0]

    expect(
      [...group.matchAll(/<button[^>]*>([^<]+)<\/button>/g)].map(([, label]) => label),
    ).toEqual(['Cidade (Garça)', '1 km', '2 km', '5 km', '10 km', '20 km'])
    expect(group).toMatch(/aria-pressed="true"[^>]*>Cidade \(Garça\)/)
    expect(html({ step: 'menu', current: null, distance: 10 })).toMatch(
      /aria-pressed="true"[^>]*>10 km/,
    )
  })

  it('aviso antes da permissão: explica o porquê e o que fica guardado', () => {
    const page = html({ step: 'device-notice', current: null })

    expect(page).toContain('o navegador vai pedir sua localização')
    expect(page).toContain('nunca o ponto exato')
    expect(page).toMatch(/<button[^>]*>Continuar<\/button>/)
    expect(page).toContain('Escolher de outro jeito')
  })

  it('negou: não é beco sem saída — CEP e cidade', () => {
    const page = html({ step: 'device-denied', current: null })

    expect(page).toMatch(/role="alert"[^>]*>Você não permitiu/)
    expect(page).toContain('Buscar por CEP')
    expect(page).toContain('Endereço, bairro ou cidade')
    expect(page).not.toContain('Tentar de novo')
  })

  it('falhou: as mesmas saídas e tentar de novo', () => {
    const page = html({ step: 'device-failed', current: null })

    expect(page).toContain('Não conseguimos sua localização agora')
    expect(page).toContain('Tentar de novo')
  })

  it('precisão ruim: avisa o tamanho do erro e deixa escolher', () => {
    const page = html({ step: 'device-poor', current: null, accuracyMeters: 3_200 })

    expect(page).toContain('cerca de 3,2 km')
    expect(page).toContain('Usar mesmo assim')
    expect(page).toContain('Buscar por CEP')
  })

  it('CEP: campo numérico com preenchimento certo e o lugar encontrado', () => {
    const page = html({ step: 'postal-code', current: null, postalCodeMatch: 'Centro, Garça' })

    expect(page).toMatch(/id="location-postal-code"[^>]*inputMode="numeric"/i)
    expect(page).toMatch(/autocomplete="postal-code"/i)
    expect(page).toContain('Encontramos: <strong')
    expect(page).toContain('Usar este local')
  })

  it('texto: só busca no envio e lista os resultados como botões', () => {
    const page = html({
      step: 'search',
      current: null,
      results: [
        { label: 'Centro, Garça - SP', latitude: -22.2, longitude: -49.6, precision: 'Locality' },
        { label: 'Garça, SP', latitude: -22.21, longitude: -49.65, precision: 'City' },
      ],
    })

    expect(page).toContain('Toque em Buscar para ver os resultados.')
    expect(page).toMatch(/aria-label="Resultados"/)
    expect(page.match(/Centro, Garça - SP|Garça, SP/g)).toHaveLength(2)
  })

  it('texto sem resultado: sugere outro caminho', () => {
    expect(html({ step: 'search', current: null, results: [] })).toContain(
      'Nada encontrado. Tente o nome da cidade ou o CEP.',
    )
  })

  it('erro da API aparece em alerta', () => {
    expect(
      html({ step: 'postal-code', current: null, error: 'Não encontramos esse CEP.' }),
    ).toMatch(/role="alert"[^>]*>Não encontramos esse CEP\./)
  })
})

describe('consts do seletor', () => {
  it('máscara de CEP enquanto digita', () => {
    expect(formatPostalCode('17400')).toBe('17400')
    expect(formatPostalCode('174000')).toBe('17400-0')
    expect(formatPostalCode('17400-000123')).toBe('17400-000')
    expect(formatPostalCode('ab17c400')).toBe('17400')
  })

  it('rótulo e buscas do CEP, do mais preciso ao mais largo', () => {
    const address = {
      postalCode: '17400070',
      street: 'Rua Carlos Ferrari',
      district: 'Centro',
      city: 'Garça',
      state: 'SP',
    }

    expect(postalCodeLabel(address)).toBe('Centro, Garça')
    expect(postalCodeQueries(address)).toEqual([
      'Rua Carlos Ferrari, Centro, Garça - SP',
      'Centro, Garça - SP',
      'Garça - SP',
    ])

    const general = { ...address, street: null, district: null }
    expect(postalCodeLabel(general)).toBe('Garça, SP')
    expect(postalCodeQueries(general)).toEqual(['Garça - SP'])
  })

  it('distância em metros ou quilômetros', () => {
    expect(formatDistance(850)).toBe('850 m')
    expect(formatDistance(1_500)).toBe('1,5 km')
  })
})
