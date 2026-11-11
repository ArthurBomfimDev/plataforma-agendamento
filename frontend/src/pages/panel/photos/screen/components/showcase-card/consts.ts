/** A vitrine tem até 3 fotos; a primeira é a capa (busca, cartão e topo da página pública). */
export const MAX_SHOWCASE_PHOTOS = 3

/**
 * A permutação que move a foto de `index` uma casa (`delta` -1 = para a esquerda, +1 = para a direita), no formato que a
 * API recebe (`PUT /businesses/current/photos/order`): a lista nova diz, em cada lugar, qual era o lugar de antes.
 * `null` quando a foto já está na ponta.
 */
export const moveOrder = (count: number, index: number, delta: -1 | 1): number[] | null => {
  const target = index + delta
  if (index < 0 || index >= count || target < 0 || target >= count) return null

  const order = Array.from({ length: count }, (_, position) => position)
  ;[order[index], order[target]] = [order[target]!, order[index]!]
  return order
}

export const positionLabel = (index: number) => (index === 0 ? 'Capa' : `Foto ${index + 1}`)
