import type { BusinessCategoryName, ProfessionalCouncilName } from '@api/models'
import type { AddressValues, BusinessValues, ResponsibleValues, WizardStep } from './types'

/** A versão do texto dos termos exibido abaixo. Muda quando o texto mudar; vai para o servidor no aceite. */
export const TERMS_VERSION = '2026-11'

/**
 * TEXTO PROVISÓRIO dos termos, sem revisão jurídica. Inclui a declaração de autorização dos profissionais, que é a
 * base para exibir nome, foto e descrição deles na página pública (Fase 4). O Arthur revisa a redação.
 */
export const TERMS_TEXT = [
  'Informei dados verdadeiros sobre o estabelecimento e sou a pessoa responsável por ele.',
  'Tenho autorização dos profissionais para exibir publicamente o nome, a foto e a descrição deles na plataforma.',
  'Sei que o estabelecimento pode ser suspenso se os dados forem falsos ou se houver denúncia procedente.',
]

export const CATEGORY_OPTIONS = [
  {
    value: 'Beleza',
    label: 'Beleza',
    description:
      'Salão, barbearia, unhas, estética. Publica na hora, quando a checklist estiver completa.',
  },
  {
    value: 'Saude',
    label: 'Saúde',
    description:
      'Clínicas e consultórios. Pede o responsável e o registro no conselho, e passa por análise antes de aparecer.',
  },
] as const satisfies ReadonlyArray<{
  value: BusinessCategoryName
  label: string
  description: string
}>

export const COUNCIL_OPTIONS: ReadonlyArray<{ value: ProfessionalCouncilName; label: string }> = [
  { value: 'Crm', label: 'CRM — Medicina' },
  { value: 'Crp', label: 'CRP — Psicologia' },
  { value: 'Crefito', label: 'CREFITO — Fisioterapia' },
  { value: 'Crn', label: 'CRN — Nutrição' },
  { value: 'Crefono', label: 'CREFONO — Fonoaudiologia' },
  { value: 'Cro', label: 'CRO — Odontologia' },
]

export const STEP_LABELS: Record<WizardStep, string> = {
  business: 'Negócio',
  document: 'Documento',
  address: 'Endereço',
  responsible: 'Responsável',
  review: 'Revisão',
}

/** Os passos de cada categoria: o responsável só existe em Saúde. */
export const stepsFor = (category: BusinessCategoryName): WizardStep[] => [
  'business',
  'document',
  'address',
  ...(category === 'Saude' ? (['responsible'] as const) : []),
  'review',
]

export const nextStep = (category: BusinessCategoryName, current: WizardStep): WizardStep => {
  const steps = stepsFor(category)
  return steps[Math.min(steps.indexOf(current) + 1, steps.length - 1)]!
}

export const previousStep = (category: BusinessCategoryName, current: WizardStep): WizardStep => {
  const steps = stepsFor(category)
  return steps[Math.max(steps.indexOf(current) - 1, 0)]!
}

// --- Validação, um erro por campo -------------------------------------------------------------------------------

export type FieldErrors<T> = Partial<Record<keyof T, string>>

export const validateBusiness = (values: BusinessValues): FieldErrors<BusinessValues> => {
  const errors: FieldErrors<BusinessValues> = {}
  const name = values.name.trim()
  if (name.length === 0) errors.name = 'Informe o nome do estabelecimento.'
  else if (name.length > 150) errors.name = 'O nome pode ter até 150 caracteres.'
  return errors
}

export const POSTAL_CODE_PATTERN = /^\d{5}-?\d{3}$/

export const validateAddress = (values: AddressValues): FieldErrors<AddressValues> => {
  const errors: FieldErrors<AddressValues> = {}
  if (!POSTAL_CODE_PATTERN.test(values.postalCode.trim()))
    errors.postalCode = 'Informe o CEP com 8 dígitos.'
  if (values.street.trim().length === 0) errors.street = 'Informe a rua.'
  if (values.streetNumber.trim().length === 0) errors.streetNumber = 'Informe o número (ou "s/n").'
  if (values.district.trim().length === 0) errors.district = 'Informe o bairro.'
  if (values.city.trim().length === 0) errors.city = 'Informe a cidade.'
  if (!/^[A-Za-z]{2}$/.test(values.state.trim())) errors.state = 'Informe a UF com 2 letras.'
  return errors
}

export const validateResponsible = (values: ResponsibleValues): FieldErrors<ResponsibleValues> => {
  const errors: FieldErrors<ResponsibleValues> = {}
  if (values.name.trim().length === 0) errors.name = 'Informe o nome do responsável.'
  if (values.councilNumber.replace(/[^A-Za-z0-9]/g, '').length === 0) {
    errors.councilNumber = 'Informe o número do registro.'
  }
  if (!/^[A-Za-z]{2}$/.test(values.councilState.trim()))
    errors.councilState = 'Informe a UF do registro.'
  return errors
}

export const hasErrors = (errors: object) => Object.values(errors).some(Boolean)
