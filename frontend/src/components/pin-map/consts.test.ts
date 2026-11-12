import { describe, expect, it } from 'vitest'
import { distanceMeters, isValidPoint, nudge } from './consts'

const DUARTINA = { latitude: -22.4118, longitude: -49.4 }

describe('nudge', () => {
  it('anda cerca de 10 m para o norte e para o leste', () => {
    expect(distanceMeters(DUARTINA, nudge(DUARTINA, 'north'))).toBeCloseTo(10, 0)
    expect(distanceMeters(DUARTINA, nudge(DUARTINA, 'east'))).toBeCloseTo(10, 0)
  })

  it('o sul e o oeste voltam ao ponto de partida', () => {
    const there = nudge(nudge(DUARTINA, 'north'), 'south')
    const back = nudge(nudge(DUARTINA, 'east'), 'west')

    expect(distanceMeters(DUARTINA, there)).toBeLessThan(0.01)
    expect(distanceMeters(DUARTINA, back)).toBeLessThan(0.01)
  })

  it('o passo em metros vale a qualquer latitude (o grau de longitude encolhe)', () => {
    const north = { latitude: 60, longitude: 10 }

    expect(distanceMeters(north, nudge(north, 'east', 100))).toBeCloseTo(100, 0)
  })
})

describe('isValidPoint', () => {
  it('aceita um ponto do mundo e recusa o que não é número ou sai dos limites', () => {
    expect(isValidPoint(DUARTINA)).toBe(true)
    expect(isValidPoint({ latitude: Number.NaN, longitude: 0 })).toBe(false)
    expect(isValidPoint({ latitude: 91, longitude: 0 })).toBe(false)
    expect(isValidPoint({ latitude: 0, longitude: -181 })).toBe(false)
  })
})

describe('distanceMeters', () => {
  it('é zero no mesmo ponto', () => {
    expect(distanceMeters(DUARTINA, DUARTINA)).toBe(0)
  })

  it('um grau de latitude são cerca de 111 km', () => {
    const a = { latitude: 0, longitude: 0 }
    const b = { latitude: 1, longitude: 0 }

    expect(distanceMeters(a, b)).toBeGreaterThan(110_000)
    expect(distanceMeters(a, b)).toBeLessThan(112_000)
  })
})
