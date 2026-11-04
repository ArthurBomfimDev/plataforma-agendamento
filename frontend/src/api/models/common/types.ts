/**
 * Contrato da API, espelhado de `backend/src/Core/Booking.Arguments`. O JSON vem em camelCase.
 *
 * Datas: `DateOnly` chega como `yyyy-MM-dd`; `DateTimeOffset` como ISO 8601 com offset, em UTC.
 * Dinheiro sempre em centavos, inteiro.
 *
 * TODO: gerar estes tipos a partir do OpenAPI (`/openapi/v1.json`) em vez de copiar à mão.
 */

export type PagedResult<T> = {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
}

/**
 * Uma imagem em três tamanhos WebP (ADR-023): 160, 640 e 1280 px no lado maior. Relativas (`/media/…`) ou
 * absolutas; quem resolve é `mediaUrl`.
 */
export type ImageSet = { small: string; medium: string; large: string }
