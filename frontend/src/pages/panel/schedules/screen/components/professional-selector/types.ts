import type { ImageSet } from '@api/models'

export type ProfessionalSelectorOption = {
  id: string
  name: string
  photo?: ImageSet | null
  hasSchedule: boolean
}

export type ProfessionalSelectorProps = {
  professionals: ProfessionalSelectorOption[]
  selectedId: string
  onSelect: (professionalId: string) => void
}
