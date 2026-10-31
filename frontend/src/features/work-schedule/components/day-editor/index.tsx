import { TEXT_ACTION, TIME_INPUT, validateRanges } from '../../consts'
import { useId, useRef, useState } from 'react'

import { Button } from '@components/button'
import { Checkbox } from '@components/checkbox'
import type { DayEditorProps } from './types'
import type { TimeRange } from '../../types'
import { X } from 'lucide-react'

/**
 * Editor das faixas de um dia, aberto logo abaixo da linha do dia (tela 12). Cada faixa é um par
 * "início até fim"; "+ faixa" acrescenta outra depois da última. As faixas só vão para a semana
 * em "Salvar <dia>", depois de validadas.
 *
 * TODO(figma): o wireframe não mostra como tirar uma faixa; aqui o ✕ aparece quando há mais de uma.
 * O wireframe também mostra "Aplicar a todos os dias úteis" marcado; aqui começa desmarcado, para
 * não sobrescrever a semana sem querer.
 */
export const DayEditor = (props: DayEditorProps) => {
  const { dayLabel, initialRanges, onCancel, onSave } = props

  const editorRef = useRef<HTMLDivElement>(null)
  const [ranges, setRanges] = useState(initialRanges)
  const [applyToWorkdays, setApplyToWorkdays] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const error = submitted ? validateRanges(ranges) : null
  const errorId = useId()

  const setTime = (index: number, edge: keyof TimeRange, value: string) =>
    setRanges((current) =>
      current.map((range, i) => (i === index ? { ...range, [edge]: value } : range)),
    )

  const addRange = () => {
    const last = ranges.at(-1)
    // A nova faixa começa onde a última termina e dura uma hora.
    const start = last ? last.end : '09:00'
    const [hours, minutes] = start.split(':').map(Number)
    const end = `${String(Math.min(hours + 1, 23)).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    setRanges((current) => [...current, { start, end }])
    // Foco no início da faixa nova, que só existe depois do próximo desenho.
    requestAnimationFrame(() =>
      [...(editorRef.current?.querySelectorAll<HTMLInputElement>('[data-range] input') ?? [])]
        .at(-2)
        ?.focus(),
    )
  }

  const removeRange = (index: number) =>
    setRanges((current) => current.filter((_, i) => i !== index))

  const save = () => {
    setSubmitted(true)
    if (validateRanges(ranges)) return
    onSave(ranges, applyToWorkdays)
  }

  return (
    <div
      ref={editorRef}
      role="group"
      aria-label={`Faixas de ${dayLabel.toLowerCase()}`}
      className="flex flex-col gap-(--space-12) rounded-sm border border-(--border-focus) bg-(--bg-page) p-3.5"
      onKeyDown={(event) => event.key === 'Escape' && onCancel()}
    >
      <div className="flex flex-wrap items-center gap-(--space-8)">
        {ranges.map((range, index) => (
          // A posição é a identidade da faixa: as faixas não têm id e não se reordenam aqui.
          <div key={index} data-range className="flex items-center gap-(--space-8)">
            {index > 0 && (
              <span aria-hidden="true" className="type-body text-(--text-disabled)">
                ·
              </span>
            )}
            <input
              type="time"
              step={300}
              required
              aria-label={`Início da faixa ${index + 1}`}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              value={range.start}
              onChange={(event) => setTime(index, 'start', event.target.value)}
              className={TIME_INPUT}
            />
            <span className="type-label text-(--text-muted)">até</span>
            <input
              type="time"
              step={300}
              required
              aria-label={`Fim da faixa ${index + 1}`}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              value={range.end}
              onChange={(event) => setTime(index, 'end', event.target.value)}
              className={TIME_INPUT}
            />
            {ranges.length > 1 && (
              <button
                type="button"
                aria-label={`Tirar a faixa ${index + 1}`}
                onClick={() => removeRange(index)}
                className="flex size-(--size-touch-min) items-center justify-center rounded-sm text-(--text-muted) hover:text-(--text-strong) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={addRange} className={TEXT_ACTION}>
          + faixa
        </button>
      </div>

      {error && (
        <p
          id={errorId}
          role="alert"
          className="type-caption flex items-center gap-(--space-4) text-(--status-rejected-fg)"
        >
          <X aria-hidden="true" className="size-4 shrink-0" />
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2.5">
        <Checkbox
          label="Aplicar a todos os dias úteis"
          checked={applyToWorkdays}
          onCheckedChange={setApplyToWorkdays}
          className="w-full sm:w-auto"
        />
        <div className="hidden flex-1 sm:block" />
        <Button variant="ghost" className="flex-1 sm:flex-none" onClick={onCancel}>
          Cancelar
        </Button>
        <Button className="flex-1 sm:flex-none" onClick={save}>
          Salvar {dayLabel.toLowerCase()}
        </Button>
      </div>
    </div>
  )
}
