import { describe, expect, it } from 'vitest'

import { failureOf } from '.'
import { roundCoordinate } from '@store/location'

describe('useGeolocation', () => {
  it('traduz os códigos do navegador para os três estados', () => {
    expect(failureOf(1)).toEqual({ state: 'denied', failure: null })
    expect(failureOf(2)).toEqual({ state: 'failed', failure: 'unavailable' })
    expect(failureOf(3)).toEqual({ state: 'failed', failure: 'timeout' })
  })
})

describe('roundCoordinate', () => {
  it('guarda só 3 casas decimais (~110 m), como o backend envia ao provedor', () => {
    expect(roundCoordinate(-22.2163456)).toBe(-22.216)
    expect(roundCoordinate(-49.6554321)).toBe(-49.655)
  })
})
