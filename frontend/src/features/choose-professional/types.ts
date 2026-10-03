export type BusinessProfessional = {
  id: string
  name: string
  specialty: string
  yearsOfExperience: number
  /** Nota média, de 0 a 5. */
  rating: number
  photoUrl?: string
}

export type ChooseProfessionalScreenProps = {
  businessId: string
  serviceId: string
  onBack?: () => void
  /** `null` = "Sem preferência": qualquer profissional que execute o serviço. */
  onSelectProfessional?: (professionalId: string | null) => void
}
