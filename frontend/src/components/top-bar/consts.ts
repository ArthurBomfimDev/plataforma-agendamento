/**
 * Cidade padrão de busca enquanto não há `useGeolocation` nem escolha do consumidor. É Garça-SP
 * porque a demonstração do TCC é feita lá e os dados de `scripts/seed-demo.ts` ficam lá.
 * TODO: trocar pela localização do aparelho (regra 5 de empacotamento: atrás de `useGeolocation`).
 */
export const DEFAULT_LOCATION = {
  label: 'Garça, SP',
  latitude: -22.2125,
  longitude: -49.6564,
} as const
