/** Um serviço na lista do painel, já com os nomes de quem o executa. */
export type ServiceListItem = {
  id: string
  name: string
  description: string | null
  durationMinutes: number
  /** Quanto o serviço ocupa na agenda: duração mais os buffers antes e depois. */
  blockedMinutes: number
  priceCents: number
  isActive: boolean
  professionalNames: string[]
}

export type ServicesData =
  | { status: 'loading' }
  | { status: 'error'; message: string; onRetry: () => void }
  | { status: 'ready'; services: ServiceListItem[] }

export type ServicesScreenProps = {
  data: ServicesData
  businessName: string
  /** Categoria do estabelecimento ("Beleza"), no subtítulo do estado vazio. */
  categoryName?: string
  /** Estabelecimento de saúde (`RequiresSensitiveHandling`): avisa o que vai para a vitrine. */
  sensitive: boolean
  onNew?: () => void
  onEdit?: (serviceId: string) => void
}

/** O que a tabela (desktop) e os cartões (celular e tablet) recebem para listar os serviços. */
export type ServiceRowsProps = {
  services: ServiceListItem[]
  onEdit?: (serviceId: string) => void
}
