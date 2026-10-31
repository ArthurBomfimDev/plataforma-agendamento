import type { Holiday, HolidayRule } from '../../types'

export type HolidaysCardProps = {
  holidays: Holiday[]
  /** Regras por data (`yyyy-MM-dd`). Feriado sem regra = fechado. */
  rules: Record<string, HolidayRule>
  onRuleChange: (holiday: Holiday, rule: HolidayRule) => void
}
