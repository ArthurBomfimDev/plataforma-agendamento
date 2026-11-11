import {
  AddIcon,
  BackHandIcon,
  ContentCutIcon,
  StarIcon,
  VerifiedUserIcon,
  VisibilityIcon,
} from '@assets/icons'

import type { HomeCategory } from './types'

/**
 * Tiles da Home (Onda 6C). Beleza e Saúde são as duas categorias que o backend filtra (`Category`); os
 * demais viram busca por termo (`Term`), casando com o nome dos serviços. Os termos foram conferidos contra os
 * serviços de `scripts/seed-demo.ts` ("Corte masculino", "Barba", "Unha em gel", "Design de sobrancelha").
 */
export const HOME_CATEGORIES: HomeCategory[] = [
  { id: 'beauty', label: 'Beleza', icon: StarIcon, search: { category: 'Beleza' } },
  { id: 'health', label: 'Saúde', icon: VerifiedUserIcon, search: { category: 'Saude' } },
  { id: 'hair', label: 'Cabelo', icon: ContentCutIcon, search: { term: 'corte' } },
  { id: 'barbershop', label: 'Barbearia', icon: AddIcon, search: { term: 'barba' } },
  { id: 'nails', label: 'Unhas', icon: BackHandIcon, search: { term: 'unha' } },
  { id: 'brows', label: 'Sobrancelha', icon: VisibilityIcon, search: { term: 'sobrancelha' } },
]
