import { Plus, ShieldCheck, Star, User } from 'lucide-react'

import type { HomeCategory, HomeEstablishment } from './types'

/**
 * Dados PROVISÓRIOS, copiados dos wireframes "01 · Home" e "01D · Home — desktop" do Figma.
 * Não são dado real. Saem quando existir a listagem de estabelecimentos em `src/lib/api`.
 */
export const HOME_CATEGORIES: HomeCategory[] = [
  { id: 'beauty', label: 'Beleza', icon: Star },
  { id: 'health', label: 'Saúde', icon: ShieldCheck },
  { id: 'wellness', label: 'Bem-estar', icon: User },
  { id: 'barbershop', label: 'Barbearia', icon: Plus },
]

export const HOME_NEARBY_ESTABLISHMENTS: HomeEstablishment[] = [
  {
    id: 'estudio-duartina',
    name: 'Estúdio Duartina',
    rating: 4.8,
    reviewCount: 128,
    distanceKm: 1.2,
    neighborhood: 'Centro',
    verified: true,
  },
  {
    id: 'barbearia-norte',
    name: 'Barbearia Norte',
    rating: 4.6,
    reviewCount: 54,
    distanceKm: 2.6,
    neighborhood: 'Jardim',
  },
  {
    id: 'salao-vila-rica',
    name: 'Salão Vila Rica',
    rating: 4.7,
    reviewCount: 91,
    distanceKm: 3.1,
    neighborhood: 'Vila Rica',
    verified: true,
  },
]
