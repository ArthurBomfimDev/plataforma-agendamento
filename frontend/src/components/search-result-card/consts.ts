export const priceWholeFormat = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

export const priceFormat = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export const NO_AVAILABILITY_MESSAGE = 'Sem horário nos próximos 7 dias'
