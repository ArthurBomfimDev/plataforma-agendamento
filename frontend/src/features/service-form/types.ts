/**
 * O que está nos campos, como foi digitado. Os tempos vêm como "30 min" e o preço como "R$ 45,00";
 * `toServiceDraft` converte para números.
 */
export type ServiceFormValues = {
  name: string
  description: string
  durationMinutes: string
  bufferBeforeMinutes: string
  bufferAfterMinutes: string
  /** Granularidade: de quanto em quanto tempo os horários aparecem para o consumidor. */
  slotStepMinutes: string
  price: string
  professionalIds: string[]
}

export type ServiceFormField = keyof ServiceFormValues

export type ServiceFormErrors = Partial<Record<ServiceFormField, string>>

/** Serviço pronto para enviar ao backend (módulo Catalog). */
export type ServiceDraft = {
  name: string
  /** `null` = sem descrição. */
  description: string | null
  durationMinutes: number
  bufferBeforeMinutes: number
  bufferAfterMinutes: number
  slotStepMinutes: number
  /** Em centavos. */
  priceCents: number
  professionalIds: string[]
}

export type ServiceProfessionalOption = { id: string; name: string }

/** Expediente usado só para pré-visualizar os horários. `HH:mm`, no fuso do estabelecimento. */
export type PreviewHours = { start: string; end: string }

export type ServiceFormScreenProps = {
  /** `new` cadastra; `edit` altera um serviço que já existe (Onda 7D). Padrão: `new`. */
  mode?: 'new' | 'edit'
  businessName: string
  /** Categoria do estabelecimento ("Beleza", "Saúde"). */
  categoryName: string
  /** Estabelecimento de saúde: avisa que nome e descrição vão para a vitrine pública. */
  sensitive?: boolean
  professionals: ServiceProfessionalOption[]
  initialValues: ServiceFormValues
  /** Expediente para a pré-visualização. Nulo: ninguém tem jornada ainda, e a tela diz isso. */
  previewHours: PreviewHours | null
  /** Enviando para a API: os botões ficam desligados. */
  saving?: boolean
  /** Erro da API ao salvar, já em português. */
  error?: string
  /** Chamado só com o formulário válido. */
  onSave?: (draft: ServiceDraft) => void
  /** Chamado depois de o Owner confirmar que descarta o que preencheu. */
  onCancel?: () => void
}
