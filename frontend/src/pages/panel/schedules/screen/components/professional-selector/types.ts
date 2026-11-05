export type ProfessionalSelectorOption = { id: string; name: string; hasSchedule: boolean }

export type ProfessionalSelectorProps = {
  professionals: ProfessionalSelectorOption[]
  selectedId: string
  onSelect: (professionalId: string) => void
}
