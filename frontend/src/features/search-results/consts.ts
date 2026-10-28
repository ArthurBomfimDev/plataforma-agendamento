import type { SearchCategory } from '@lib/api/search'

/** Rótulo de cada categoria do backend na tela. */
export const CATEGORY_LABELS: Record<SearchCategory, string> = {
  Beleza: 'Beleza',
  Saude: 'Saúde',
}

/** Tetos de preço oferecidos, em centavos. O backend filtra pelo "a partir de" do serviço em destaque. */
export const PRICE_CEILINGS = [5_000, 10_000, 20_000] as const

/** `5000` → `Até R$ 50`. Montado à mão: o `Intl` muda o espaço de ambiente para ambiente. */
export const priceCeilingLabel = (cents: number) => `Até R$ ${Math.round(cents / 100)}`

export const resultsCount = (total: number) =>
  total === 1 ? '1 resultado' : `${total.toLocaleString('pt-BR')} resultados`
