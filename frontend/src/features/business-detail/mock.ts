import type { BusinessDetail } from './types'

/**
 * Dados PROVISÓRIOS, copiados do wireframe "03 · Página do estabelecimento" do Figma.
 * Não são dado real. Saem quando existir a consulta de estabelecimento em `src/lib/api`.
 * O Figma só desenha o Estúdio Duartina; qualquer outro id cai no estado "não encontrado".
 */
export const MOCK_BUSINESSES: Record<string, BusinessDetail> = {
  'estudio-duartina': {
    id: 'estudio-duartina',
    name: 'Estúdio Duartina',
    rating: 4.8,
    reviewCount: 128,
    verified: true,
    street: 'Rua Exemplo, 100',
    neighborhood: 'Centro',
    distanceKm: 1.2,
    openUntil: '18:00',
    services: [
      { id: 'corte-masculino', name: 'Corte masculino', durationMinutes: 30, priceCents: 4500 },
      { id: 'corte-barba', name: 'Corte + barba', durationMinutes: 60, priceCents: 8000 },
      { id: 'barba', name: 'Barba', durationMinutes: 20, priceCents: 3000 },
    ],
  },
}
