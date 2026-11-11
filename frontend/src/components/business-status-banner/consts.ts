import type { BannerBusiness, BannerState } from './types'
import type { ChecklistItemResponse } from '@api/models'

export const bannerState = (
  business: Pick<BannerBusiness, 'status' | 'verificationLevel'>,
): BannerState => {
  switch (business.status) {
    case 'PendingReview':
      return 'review'
    case 'Suspended':
      return 'suspended'
    case 'Active':
      return 'active'
    default:
      return business.verificationLevel === 'Rejected' ? 'rejected' : 'draft'
  }
}

/** Cada item da checklist em linguagem de dono. As chaves vêm de `ActivationChecklist` no backend. */
export const CHECKLIST_LABELS: Record<string, string> = {
  document: 'Documento informado',
  terms: 'Aceitar os termos de uso e a política de privacidade',
  responsible: 'Informar o responsável e o registro no conselho',
  address: 'Informar o endereço',
  location_confirmed: 'Confirmar a localização no mapa',
  professional: 'Cadastrar ao menos 1 profissional',
  service_with_professional: 'Cadastrar ao menos 1 serviço com profissional habilitado',
  work_schedule: 'Definir a jornada semanal de um profissional',
}

/** A consequência de deixar o item pendente (a explicação da falha silenciosa), em uma linha. */
export const CHECKLIST_HINTS: Record<string, string> = {
  terms: 'Declaração de que você responde pelo estabelecimento.',
  responsible: 'O registro é conferido por um administrador da plataforma.',
  address: 'Sem endereço o estabelecimento não tem onde ser encontrado.',
  location_confirmed: 'O pino define o raio em que o estabelecimento aparece na busca.',
  professional: 'Sem profissional não existe agenda.',
  service_with_professional: 'Serviço sem profissional habilitado não pode ser agendado.',
  work_schedule: 'Sem jornada, a agenda nasce vazia mesmo com tudo certo.',
}

/** Parâmetro da URL que liga o modo guiado: o valor é a chave do item da checklist que o dono está resolvendo. */
export const GUIDE_PARAM = 'passo'

/** O item em linguagem curta, para o título do passo guiado ("Passo 4 de 6 · …"). */
export const STEP_TITLES: Record<string, string> = {
  professional: 'profissional cadastrado',
  service_with_professional: 'serviço com profissional habilitado',
  work_schedule: 'jornada semanal definida',
}

/** O que fazer na página em que o passo guiado leva o dono. */
export const STEP_GUIDES: Record<string, string> = {
  professional: 'Cadastre quem atende no estabelecimento. O passo marca sozinho.',
  service_with_professional:
    'Designe quem executa o serviço destacado abaixo. O passo marca sozinho.',
  work_schedule: 'Defina os dias e horários de um profissional. O passo marca sozinho.',
}

/** Só o que o servidor exige hoje para enviar ou publicar. */
export const requiredItems = (checklist: ChecklistItemResponse[]) =>
  checklist.filter((item) => item.requiredForSubmit)

export const missingItems = (checklist: ChecklistItemResponse[]) =>
  requiredItems(checklist).filter((item) => !item.done)

export const labelOf = (key: string) => CHECKLIST_LABELS[key] ?? key
export const hintOf = (key: string) => CHECKLIST_HINTS[key]

/**
 * O número do passo: a posição do item pendente entre os obrigatórios. `undefined` se o item não existe
 * ou já foi feito — o passo guiado acaba sozinho quando o item é concluído.
 */
export const stepOf = (checklist: ChecklistItemResponse[], key: string) => {
  const items = requiredItems(checklist)
  const index = items.findIndex((item) => item.key === key && !item.done)
  return index < 0 ? undefined : { number: index + 1, total: items.length }
}

/** O próximo item pendente depois de `key`, voltando ao começo da lista. `undefined` se não há outro. */
export const nextPendingKey = (checklist: ChecklistItemResponse[], key: string) => {
  const pending = missingItems(checklist)
  const index = pending.findIndex((item) => item.key === key)
  return pending.length > 1 ? pending[(index + 1) % pending.length]?.key : undefined
}

/** Aparência de cada estado da faixa: nunca só a cor — cada um tem ícone e frase próprios (ver o componente). */
export const TONE_CLASSES = {
  pending: {
    surface: 'bg-(--status-pending-bg)',
    accent: 'bg-(--status-pending-fg)',
    text: 'text-(--status-pending-fg)',
    segment: 'bg-(--status-pending-fg)',
    segmentOutline: 'border-(--status-pending-fg)',
  },
  info: {
    surface: 'bg-(--action-soft)',
    accent: 'bg-(--action-primary)',
    text: 'text-(--action-primary)',
    segment: 'bg-(--action-primary)',
    segmentOutline: 'border-(--action-primary)',
  },
  confirmed: {
    surface: 'bg-(--status-confirmed-bg)',
    accent: 'bg-(--status-confirmed-fg)',
    text: 'text-(--status-confirmed-fg)',
    segment: 'bg-(--status-confirmed-fg)',
    segmentOutline: 'border-(--status-confirmed-fg)',
  },
  rejected: {
    surface: 'bg-(--status-rejected-bg)',
    accent: 'bg-(--status-rejected-fg)',
    text: 'text-(--status-rejected-fg)',
    segment: 'bg-(--status-rejected-fg)',
    segmentOutline: 'border-(--status-rejected-fg)',
  },
} as const
