import { Eye, Hand, Plus, Scissors, ShieldCheck, Star } from 'lucide-react'

import type { HomeCategory } from './types'

/**
 * Tiles da Home (Onda 6C). Beleza e Saúde são as duas categorias que o backend filtra (`Category`); os
 * demais viram busca por termo (`Term`), casando com o nome dos serviços. Os termos foram conferidos contra os
 * serviços de `scripts/seed-demo.ts` ("Corte masculino", "Barba", "Unha em gel", "Design de sobrancelha").
 */
export const HOME_CATEGORIES: HomeCategory[] = [
  { id: 'beauty', label: 'Beleza', icon: Star, search: { category: 'Beleza' } },
  { id: 'health', label: 'Saúde', icon: ShieldCheck, search: { category: 'Saude' } },
  { id: 'hair', label: 'Cabelo', icon: Scissors, search: { term: 'corte' } },
  { id: 'barbershop', label: 'Barbearia', icon: Plus, search: { term: 'barba' } },
  { id: 'nails', label: 'Unhas', icon: Hand, search: { term: 'unha' } },
  { id: 'brows', label: 'Sobrancelha', icon: Eye, search: { term: 'sobrancelha' } },
]
