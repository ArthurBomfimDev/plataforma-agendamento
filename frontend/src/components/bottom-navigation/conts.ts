import { Calendar, Search, User } from 'lucide-react'
import type { NavigationItemId } from './types'

export const ITEMS = [
  { id: 'search', label: 'Buscar', icon: Search },
  { id: 'appointments', label: 'Agendamentos', icon: Calendar },
  { id: 'profile', label: 'Perfil', icon: User },
] as const satisfies ReadonlyArray<{ id: NavigationItemId; label: string; icon: typeof Search }>
