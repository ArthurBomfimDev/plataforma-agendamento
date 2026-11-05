import type { TimeRange } from '../../types'

export type DayEditorProps = {
  /** "Quarta": vira "Salvar quarta". */
  dayLabel: string
  initialRanges: TimeRange[]
  onCancel: () => void
  /** Chamado só com as faixas válidas. */
  onSave: (ranges: TimeRange[], applyToWorkdays: boolean) => void
}
