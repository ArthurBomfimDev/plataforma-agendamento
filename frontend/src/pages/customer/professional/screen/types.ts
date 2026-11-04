import type { ImageSet } from '@api/models'

export type ProfessionalPageService = {
  id: string
  name: string
  durationMinutes: number
  priceCents: number
  photo: ImageSet | null
}

/** Os horários livres de um dia ("Hoje", "Amanhã"), já formatados no fuso do estabelecimento. */
export type DayFreeSlots = { label: string; times: string[] }

export type ProfessionalPage = {
  id: string
  name: string
  specialty: string | null
  bio: string | null
  /** Registro profissional (Saúde), só se informado. */
  registration: string | null
  photo: ImageSet | null
  business: { id: string; name: string; address: string | null; category: string }
  services: ProfessionalPageService[]
  /** Próximos horários livres de hoje e de amanhã, para o primeiro serviço. Vazio: nenhum nos dois dias. */
  nextSlots: DayFreeSlots[]
  /**
   * Nota do profissional (módulo de avaliações). Ausente = ainda não existe média (menos de 3 avaliações): o espaço fica
   * escondido.
   */
  rating?: { average: number; count: number } | null
}

export type ProfessionalPageData =
  | { status: 'loading' }
  | { status: 'error'; message: string; onRetry: () => void }
  | { status: 'ready'; professional: ProfessionalPage }

export type ProfessionalPageScreenProps = {
  data: ProfessionalPageData
  /** Agenda com este profissional; sem `serviceId`, o primeiro serviço dele. */
  onBook?: (serviceId?: string) => void
  onOpenBusiness?: (businessId: string) => void
  /** Pedido de remoção do perfil. `null` se deu certo, senão a mensagem de erro. */
  onRequestRemoval?: (reason: string, contact: string | null) => Promise<string | null>
}
