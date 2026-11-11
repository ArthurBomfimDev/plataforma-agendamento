import type { ImageSet } from '@api/models'

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
  /** Os mesmos profissionais, com a foto do DTO, para os avatares da coluna "Quem executa". */
  professionals: { name: string; photo?: ImageSet | null }[]
}

export type ServicesData =
  | { status: 'loading' }
  | { status: 'error'; message: string; onRetry: () => void }
  | { status: 'ready'; services: ServiceListItem[] }

/** Passo guiado da verificação nesta página: o serviço destacado e o número do passo. */
export type ServiceGuide = {
  serviceId: string
  serviceName: string
  step: { number: number; total: number }
}

export type ServicesScreenProps = {
  data: ServicesData
  /** O dono está no passo "serviço com profissional habilitado": destaca o serviço sem profissional. */
  guidedStep?: ServiceGuide['step']
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
  /** Serviço destacado com a ação do passo guiado logo abaixo. */
  guide?: ServiceGuide
}
