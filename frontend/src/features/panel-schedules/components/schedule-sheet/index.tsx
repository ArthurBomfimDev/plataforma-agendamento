import { WEEKDAYS, validateSchedule } from '../../consts'

import { Button } from '@components/button'
import { PanelSheet } from '@components/panel-sheet'
import type { ScheduleDraft } from '../../types'
import type { ScheduleSheetProps } from './types'
import { SelectField } from '@components/select-field'
import { TextField } from '@components/text-field'
import { useState } from 'react'

/** Uma faixa da jornada: dia, horário e de quando a quando vale. O 409 de faixa cruzada volta aqui. */
export const ScheduleSheet = (props: ScheduleSheetProps) => {
  const { open, onOpenChange, professionalName, initial, editing, onSave } = props

  const [draft, setDraft] = useState<ScheduleDraft>(initial)
  const [touched, setTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()

  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setDraft(initial)
      setTouched(false)
      setError(undefined)
    }
  }

  const errors = touched ? validateSchedule(draft) : {}
  const set = (patch: Partial<ScheduleDraft>) => setDraft((current) => ({ ...current, ...patch }))

  return (
    <PanelSheet
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? 'Editar horário' : 'Novo horário'}
      description={professionalName}
    >
      <form
        noValidate
        className="flex flex-col gap-(--space-16)"
        onSubmit={async (event) => {
          event.preventDefault()
          setTouched(true)
          if (Object.keys(validateSchedule(draft)).length > 0) return
          setSaving(true)
          setError(undefined)
          const failure = await onSave(draft)
          setSaving(false)
          if (failure) setError(failure)
        }}
      >
        <SelectField
          id="schedule-day"
          label="Dia da semana"
          value={String(draft.dayOfWeek)}
          options={WEEKDAYS.map(({ day, label }) => ({ value: String(day), label }))}
          onChange={(event) => set({ dayOfWeek: Number(event.target.value) })}
        />
        <div className="grid grid-cols-2 gap-(--space-12)">
          <TextField
            id="schedule-start"
            label="Início"
            type="time"
            step={900}
            value={draft.start}
            error={errors.start}
            onChange={(event) => set({ start: event.target.value })}
          />
          <TextField
            id="schedule-end"
            label="Fim"
            type="time"
            step={900}
            value={draft.end}
            error={errors.end}
            onChange={(event) => set({ end: event.target.value })}
          />
        </div>
        <TextField
          id="schedule-from"
          label="Vale a partir de"
          type="date"
          value={draft.effectiveFrom}
          error={errors.effectiveFrom}
          onChange={(event) => set({ effectiveFrom: event.target.value })}
        />
        <TextField
          id="schedule-to"
          label="Vale até (opcional)"
          type="date"
          helper="Vazio: vale sem data para acabar."
          value={draft.effectiveTo ?? ''}
          error={errors.effectiveTo}
          onChange={(event) => set({ effectiveTo: event.target.value || null })}
        />
        <p className="type-caption text-(--text-muted)">
          Mudar a jornada não mexe em agendamentos já marcados.
        </p>

        {error && (
          <p role="alert" className="type-label text-(--status-rejected-fg)">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={saving}>
          {saving ? 'Salvando…' : 'Salvar horário'}
        </Button>
      </form>
    </PanelSheet>
  )
}
