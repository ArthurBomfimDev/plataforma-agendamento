import type {
  PreviewHours,
  ServiceDraft,
  ServiceFormErrors,
  ServiceFormField,
  ServiceFormValues,
} from './types'
import { toMinutes, toTime } from '@features/business-agenda/consts'

import { priceFormat } from '@components/service-card/consts'

/** Ids dos campos, na ordem da tela: o primeiro com erro recebe o foco ao salvar. */
export const FIELD_IDS = {
  name: 'service-name',
  description: 'service-description',
  durationMinutes: 'service-duration',
  bufferBeforeMinutes: 'service-buffer-before',
  bufferAfterMinutes: 'service-buffer-after',
  slotStepMinutes: 'service-slot-step',
  price: 'service-price',
  professionalIds: 'service-professionals',
} as const satisfies Record<ServiceFormField, string>

/** Cartão de seção do Figma: superfície, borda sutil e raio grande. */
export const SECTION_CARD =
  'flex flex-col gap-(--space-8) rounded-lg border border-(--border-subtle) bg-(--bg-surface) px-(--space-16) py-(--space-12)'

/** "30 min", "30", "30min" → 30. Sem dígito nenhum = `null`. */
export const parseMinutes = (value: string) => {
  const digits = value.replace(/\D/g, '')
  return digits ? Number(digits) : null
}

export const minutesLabel = (minutes: number) => `${minutes} min`

/** Reescreve o campo de tempo como "30 min" ao sair dele. Vazio continua vazio. */
export const normalizeMinutes = (value: string) => {
  const minutes = parseMinutes(value)
  return minutes === null ? '' : minutesLabel(minutes)
}

/** Até R$ 9.999.999,99: o bastante para um serviço, e longe do limite de precisão do `number`. */
const MAX_PRICE_DIGITS = 9

/**
 * O campo de preço guarda só centavos: os dígitos de "R$ 1.250,50" são 125050. Sem dígito = `null`.
 */
export const parseCents = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, MAX_PRICE_DIGITS)
  return digits ? Number(digits) : null
}

export const formatCents = (cents: number) => priceFormat.format(cents / 100)

/**
 * Máscara de real a cada tecla, digitando da direita para a esquerda como em caixa de banco:
 * "4" → "R$ 0,04", "4500" → "R$ 45,00". Apagar tudo deixa o campo vazio.
 */
export const maskPrice = (value: string) => {
  const cents = parseCents(value)
  return cents ? formatCents(cents) : ''
}

/** Tempos como números; buffer vazio vale 0, o padrão do domínio. */
export const timesOf = (values: ServiceFormValues) => ({
  duration: parseMinutes(values.durationMinutes) ?? 0,
  bufferBefore: parseMinutes(values.bufferBeforeMinutes) ?? 0,
  bufferAfter: parseMinutes(values.bufferAfterMinutes) ?? 0,
  slotStep: parseMinutes(values.slotStepMinutes) ?? 0,
})

/** Limites do `Service` no domínio (`Service.cs`): a tela avisa antes de a API recusar. */
export const SERVICE_LIMITS = { maxDuration: 480, maxBuffer: 120, minSlotStep: 5 } as const

/**
 * Regras do `Service` (modelo de domínio, §6): nome e duração obrigatórios, granularidade de no
 * máximo a duração e ao menos um profissional habilitado. O backend valida de novo; aqui é só para
 * o Owner corrigir antes de enviar.
 *
 * `requireProfessional` falso: o estabelecimento ainda não tem profissional ativo, e o serviço pode
 * ser salvo sem ninguém (não aparece para agendar até ter).
 */
export const validateService = (
  values: ServiceFormValues,
  requireProfessional = true,
): ServiceFormErrors => {
  const { duration, bufferBefore, bufferAfter, slotStep } = timesOf(values)
  const errors: ServiceFormErrors = {}
  const bufferError = `Até ${minutesLabel(SERVICE_LIMITS.maxBuffer)}.`

  if (!values.name.trim()) errors.name = 'Informe o nome do serviço.'
  if (duration <= 0) errors.durationMinutes = 'Informe a duração.'
  else if (duration > SERVICE_LIMITS.maxDuration)
    errors.durationMinutes = `Até ${minutesLabel(SERVICE_LIMITS.maxDuration)} (8 h).`
  if (bufferBefore > SERVICE_LIMITS.maxBuffer) errors.bufferBeforeMinutes = bufferError
  if (bufferAfter > SERVICE_LIMITS.maxBuffer) errors.bufferAfterMinutes = bufferError
  if (slotStep <= 0) errors.slotStepMinutes = 'Informe de quanto em quanto tempo.'
  else if (slotStep < SERVICE_LIMITS.minSlotStep)
    errors.slotStepMinutes = `O mínimo é ${minutesLabel(SERVICE_LIMITS.minSlotStep)}.`
  else if (duration > 0 && slotStep > duration)
    errors.slotStepMinutes = `Não pode passar da duração (${minutesLabel(duration)}).`
  if (parseCents(values.price) === null) errors.price = 'Informe o preço, como R$ 45,00.'
  if (requireProfessional && values.professionalIds.length === 0)
    errors.professionalIds = 'Escolha ao menos um profissional.'

  return errors
}

/** Serviço novo: vazio, com os padrões do domínio (sem intervalos, horários de 15 em 15 min). */
export const EMPTY_SERVICE_VALUES: ServiceFormValues = {
  name: '',
  description: '',
  durationMinutes: '',
  bufferBeforeMinutes: minutesLabel(0),
  bufferAfterMinutes: minutesLabel(0),
  slotStepMinutes: minutesLabel(15),
  price: '',
  professionalIds: [],
}

/** Um serviço da API no formato dos campos, para editar. */
export const toFormValues = (service: {
  name: string
  description: string | null
  durationMinutes: number
  bufferBeforeMinutes: number
  bufferAfterMinutes: number
  slotStepMinutes: number
  priceCents: number
  professionals: ReadonlyArray<{ professionalId: string }>
}): ServiceFormValues => ({
  name: service.name,
  description: service.description ?? '',
  durationMinutes: minutesLabel(service.durationMinutes),
  bufferBeforeMinutes: minutesLabel(service.bufferBeforeMinutes),
  bufferAfterMinutes: minutesLabel(service.bufferAfterMinutes),
  slotStepMinutes: minutesLabel(service.slotStepMinutes),
  price: formatCents(service.priceCents),
  professionalIds: service.professionals.map(({ professionalId }) => professionalId),
})

/** Converte o formulário já validado no contrato que vai para o backend. */
export const toServiceDraft = (values: ServiceFormValues): ServiceDraft => {
  const { duration, bufferBefore, bufferAfter, slotStep } = timesOf(values)
  const description = values.description.trim()

  return {
    name: values.name.trim(),
    description: description || null,
    durationMinutes: duration,
    bufferBeforeMinutes: bufferBefore,
    bufferAfterMinutes: bufferAfter,
    slotStepMinutes: slotStep,
    priceCents: parseCents(values.price) ?? 0,
    professionalIds: values.professionalIds,
  }
}

export const sameValues = (a: ServiceFormValues, b: ServiceFormValues) =>
  (Object.keys(a) as ServiceFormField[]).every((field) =>
    field === 'professionalIds'
      ? a.professionalIds.toSorted().join() === b.professionalIds.toSorted().join()
      : a[field] === b[field],
  )

/**
 * Horários que o consumidor veria num expediente: de `step` em `step`, desde que a ocupação total
 * (buffers + atendimento) termine até o fim do expediente. `firstLeftOut` é o primeiro início que
 * ficou de fora, para explicar o corte.
 */
export const previewSlots = (hours: PreviewHours, occupancy: number, step: number) => {
  const start = toMinutes(hours.start)
  const end = toMinutes(hours.end)
  if (occupancy <= 0 || step <= 0) return { slots: [], firstLeftOut: null }

  const slots: string[] = []
  let time = start
  for (; time + occupancy <= end; time += step) slots.push(toTime(time))

  return { slots, firstLeftOut: time < end ? toTime(time) : null }
}
