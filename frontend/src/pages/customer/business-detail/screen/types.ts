import type { BusinessProfessional } from '@pages/customer/booking/choose-professional/screen/types'
import type { ImageSet } from '@api/models'
import type { ReviewsSectionProps } from '@components/reviews-section'
import type { ServiceCardProps } from '@components/service-card/types'

export type BusinessService = Pick<ServiceCardProps, 'name' | 'durationMinutes' | 'priceCents'> & {
  id: string
  /** Foto do serviço. Nula: o ícone padrão da categoria. */
  photo?: ImageSet | null
}

export type BusinessDetail = {
  id: string
  name: string
  /** Nota média, de 0 a 5. Ausente = ainda sem avaliações; a nota não aparece. */
  rating?: number
  /** Presente = a nota foi lida: sem `rating` ela é "Novo". Ausente = ainda carregando; a tela não afirma nada. */
  reviewCount?: number
  verified?: boolean
  street: string
  neighborhood: string
  /** Ausente quando não se sabe de onde o consumidor está buscando. */
  distanceKm?: number
  /** Horário de fechamento de hoje, já formatado no fuso do estabelecimento. Ausente = não exibe. */
  openUntil?: string
  /** `Beleza` ou `Saude`: escolhe a ilustração padrão quando não há capa. */
  category: string
  /** Sem capa, a tela mostra a ilustração da categoria (Onda 6D). */
  cover?: ImageSet | null
  /** A vitrine: até 3 fotos, a primeira é a capa. Ausente: vale a capa. */
  photos?: ImageSet[]
  /** Sem logotipo, nada aparece ao lado do nome. */
  logo?: ImageSet | null
  /** Em quantas horas o estabelecimento confirma ou recusa um pedido. */
  confirmationHours: number
  services: BusinessService[]
}

export type BusinessDetailScreenProps = {
  business: BusinessDetail
  /** Próximos horários livres, `HH:mm`, para o card "Agendar agora" do desktop. Vazio = não exibe. */
  nextFreeSlots?: string[]
  onBookService?: (serviceId: string) => void
  /** Equipe ativa (ADR-031): cada cartão leva à página do profissional. Ausente = a aba mostra "carregando". */
  professionals?: BusinessProfessional[]
  onOpenProfessional?: (professionalId: string) => void
  /** Nota e lista de avaliações (ADR-032). Ausente = a aba mostra "Em breve". */
  reviews?: Pick<ReviewsSectionProps, 'summary' | 'list'>
  /** "Denunciar este estabelecimento": `null` se enviou, senão a mensagem de erro. Sem a prop, o botão não aparece. */
  onReport?: (reason: string) => Promise<string | null>
}
