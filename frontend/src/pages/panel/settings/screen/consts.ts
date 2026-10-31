import type { PolicyField, PolicyValues } from './types'

import type { SchedulingPolicyResponse } from '@api/models'

/** Limites de `Business.UpdateSchedulingPolicy`, e o que cada campo quer dizer para o dono. */
export const POLICY_FIELDS: ReadonlyArray<{
  field: PolicyField
  label: string
  unit: string
  min: number
  max: number
  helper: string
}> = [
  {
    field: 'pendingExpirationHours',
    label: 'Prazo para responder um pedido',
    unit: 'horas',
    min: 1,
    max: 72,
    helper: 'Sem resposta nesse prazo, o pedido expira e o horário volta a ficar livre.',
  },
  {
    field: 'minLeadTimeHours',
    label: 'Antecedência mínima',
    unit: 'horas',
    min: 0,
    max: 72,
    helper: 'Quanto tempo antes do horário o consumidor ainda pode pedir.',
  },
  {
    field: 'bookingHorizonDays',
    label: 'Até quando dá para agendar',
    unit: 'dias',
    min: 1,
    max: 365,
    helper: 'Quantos dias para frente a agenda fica aberta.',
  },
  {
    field: 'cancellationWindowHours',
    label: 'Prazo para o consumidor cancelar',
    unit: 'horas',
    min: 0,
    max: 48,
    helper: 'Até quantas horas antes do horário o consumidor cancela sozinho.',
  },
]

/** Horizontes oferecidos (7CF), dentro do limite do domínio (1 a 365 dias). */
export const HORIZON_OPTIONS = [30, 60, 90, 180] as const

/** As opções, mais o valor atual se ele for outro (definido antes, pelo seed ou pela API): ele não some. */
export const horizonOptions = (current: number) =>
  Number.isInteger(current) && current > 0 && !HORIZON_OPTIONS.some((days) => days === current)
    ? [...HORIZON_OPTIONS, current].sort((a, b) => a - b)
    : [...HORIZON_OPTIONS]

/** "60 dias (cerca de 2 meses)". */
export const horizonLabel = (days: number) => {
  const months = Math.round(days / 30)
  return days % 30 === 0 && months >= 1
    ? `${days} dias (cerca de ${months} ${months === 1 ? 'mês' : 'meses'})`
    : `${days} dias`
}

export const toPolicyValues = (policy: SchedulingPolicyResponse): PolicyValues => ({
  autoConfirm: policy.autoConfirm,
  pendingExpirationHours: String(policy.pendingExpirationHours),
  minLeadTimeHours: String(policy.minLeadTimeHours),
  bookingHorizonDays: String(policy.bookingHorizonDays),
  cancellationWindowHours: String(policy.cancellationWindowHours),
})

/** Número inteiro dentro do limite do domínio; senão, a mensagem do campo. */
export const validatePolicy = (values: PolicyValues): Partial<Record<PolicyField, string>> => {
  const errors: Partial<Record<PolicyField, string>> = {}
  for (const { field, min, max, unit } of POLICY_FIELDS) {
    const raw = values[field].trim()
    const value = Number(raw)
    if (!/^\d+$/.test(raw) || value < min || value > max)
      errors[field] = `De ${min} a ${max} ${unit}.`
  }
  return errors
}

export const toPolicy = (values: PolicyValues): Omit<SchedulingPolicyResponse, 'timeZone'> => ({
  autoConfirm: values.autoConfirm,
  pendingExpirationHours: Number(values.pendingExpirationHours),
  minLeadTimeHours: Number(values.minLeadTimeHours),
  bookingHorizonDays: Number(values.bookingHorizonDays),
  cancellationWindowHours: Number(values.cancellationWindowHours),
})
