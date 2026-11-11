import { MAX_SHOWCASE_PHOTOS, moveOrder, positionLabel } from './consts'
import { describe, expect, it } from 'vitest'

describe('moveOrder', () => {
  it('troca a foto com a vizinha, no formato da API', () => {
    expect(moveOrder(3, 1, -1)).toEqual([1, 0, 2])
    expect(moveOrder(3, 1, 1)).toEqual([0, 2, 1])
    expect(moveOrder(3, 2, -1)).toEqual([0, 2, 1])
  })

  it('mover a segunda para a esquerda a torna a capa', () => {
    expect(moveOrder(2, 1, -1)).toEqual([1, 0])
  })

  it('nas pontas, não há o que mover', () => {
    expect(moveOrder(3, 0, -1)).toBeNull()
    expect(moveOrder(3, 2, 1)).toBeNull()
    expect(moveOrder(1, 0, 1)).toBeNull()
  })

  it('lugar fora da lista não move nada', () => {
    expect(moveOrder(2, 5, -1)).toBeNull()
    expect(moveOrder(2, -1, 1)).toBeNull()
  })

  it('o resultado é sempre uma permutação', () => {
    for (let count = 1; count <= MAX_SHOWCASE_PHOTOS; count += 1) {
      for (let index = 0; index < count; index += 1) {
        for (const delta of [-1, 1] as const) {
          const order = moveOrder(count, index, delta)
          if (order) expect([...order].sort()).toEqual(Array.from({ length: count }, (_, i) => i))
        }
      }
    }
  })
})

describe('positionLabel', () => {
  it('a primeira é a capa', () => {
    expect(positionLabel(0)).toBe('Capa')
    expect(positionLabel(2)).toBe('Foto 3')
  })
})
