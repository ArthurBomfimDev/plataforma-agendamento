import type { HolidayRule } from '../../types'

export type HolidayRuleMenuProps = {
  holidayName: string
  rule: HolidayRule
  onChange: (rule: HolidayRule) => void
}
