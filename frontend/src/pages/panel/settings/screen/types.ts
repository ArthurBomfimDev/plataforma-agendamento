import type { SchedulingPolicyResponse } from '@api/models'

export type SettingsData =
  | { status: 'loading' }
  | { status: 'error'; message: string; onRetry: () => void }
  | { status: 'ready'; policy: SchedulingPolicyResponse }

/** Os números como digitados: a tela valida antes de converter. */
export type PolicyValues = {
  autoConfirm: boolean
  pendingExpirationHours: string
  minLeadTimeHours: string
  bookingHorizonDays: string
  cancellationWindowHours: string
}

export type PolicyField = Exclude<keyof PolicyValues, 'autoConfirm'>

export type SettingsScreenProps = {
  data: SettingsData
  businessName: string
  /** Resolve `null` se gravou, senão a mensagem de erro. */
  onSave?: (policy: Omit<SchedulingPolicyResponse, 'timeZone'>) => Promise<string | null>
}
