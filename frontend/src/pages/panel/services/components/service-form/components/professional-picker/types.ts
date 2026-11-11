import type { ServiceProfessionalOption } from '../../types'

export type ProfessionalPickerProps = {
  id: string
  professionals: ServiceProfessionalOption[]
  selectedIds: string[]
  onToggle: (professionalId: string) => void
  error?: string
}
