import { Calendar, Search, User } from 'lucide-react'
import type { NavigationItemId } from './types'

export const ITEMS = [
  { id: 'search', label: 'Buscar', icon: Search },
  { id: 'appointments', label: 'Agendamentos', icon: Calendar },
  { id: 'profile', label: 'Perfil', icon: User },
] as const satisfies ReadonlyArray<{ id: NavigationItemId; label: string; icon: typeof Search }>

// Altura da navegação inferior (8 + 44 + 16) mais a safe-area, para o conteúdo não ficar por baixo.
export const CONTENT_BOTTOM_PADDING =
  'pb-[calc(var(--space-16)+var(--space-8)+var(--size-touch-min)+var(--space-16)+env(safe-area-inset-bottom))]'
