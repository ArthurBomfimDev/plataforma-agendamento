import type { LucideIcon } from 'lucide-react'

import type { CardEstablishmentProps } from '../../components/card-establishment/types'

export type HomeCategory = {
  id: string
  label: string
  icon: LucideIcon
}

export type HomeEstablishment = CardEstablishmentProps & {
  id: string
}
