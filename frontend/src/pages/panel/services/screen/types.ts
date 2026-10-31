/** Um serviço na lista do painel, já com os nomes de quem o executa. */
export type ServiceListItem = {
  id: string
  name: string
  durationMinutes: number
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
  /** Estabelecimento de saúde (`RequiresSensitiveHandling`): avisa o que vai para a vitrine. */
  sensitive: boolean
  onNew?: () => void
  onEdit?: (serviceId: string) => void
  /** Ativa ou desativa. Resolve `true` se deu certo; o erro vira toast em quem chamou. */
  onToggleActive?: (service: ServiceListItem) => Promise<boolean>
}
