import type { AffectedItem, ExceptionDraft } from '../../types'
import { KIND_HELP, KIND_LABELS, newExceptionDraft, validateException } from '../../consts'

import { Button } from '@components/button'
import type { ExceptionSheetProps } from './types'
import { PanelSheet } from '@components/panel-sheet'
import type { ScheduleExceptionKind } from '@lib/api/types'
import { SelectField } from '@components/select-field'
import { TextField } from '@components/text-field'
import { useState } from 'react'

const ALL = ''

/**
 * Novo bloqueio, em dois passos (PROJECT-CONTEXT §5): o período e, antes de gravar, a prévia dos
 * agendamentos que caem nele. Com agendamentos, o dono escolhe manter todos ou cancelar todos (com
 * motivo); "voltar e ajustar" é voltar ao primeiro passo. Sem agendamento, grava direto.
 */
export const ExceptionSheet = (props: ExceptionSheetProps) => {
  const { open, onOpenChange, professionals, today, onPreview, onAdd } = props

  const [draft, setDraft] = useState<ExceptionDraft>(newExceptionDraft(today))
  const [touched, setTouched] = useState(false)
  const [affected, setAffected] = useState<AffectedItem[] | null>(null)
  const [choice, setChoice] = useState<'Keep' | 'CancelAll'>('Keep')
  const [cancelReason, setCancelReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setDraft(newExceptionDraft(today))
      setTouched(false)
      setAffected(null)
      setChoice('Keep')
      setCancelReason('')
      setError(undefined)
    }
  }

  const errors = touched ? validateException(draft) : {}
  const set = (patch: Partial<ExceptionDraft>) => {
    setDraft((current) => ({ ...current, ...patch }))
    setAffected(null)
  }
  const reasonError =
    touched && choice === 'CancelAll' && !cancelReason.trim()
      ? 'Informe o motivo: ele aparece para quem tinha horário.'
      : undefined

  const save = async (existingAppointments: 'Keep' | 'CancelAll') => {
    setBusy(true)
    setError(undefined)
    const failure = await onAdd(draft, {
      existingAppointments,
      cancellationReason: existingAppointments === 'CancelAll' ? cancelReason.trim() : null,
    })
    setBusy(false)
    if (failure) setError(failure)
  }

  return (
    <PanelSheet open={open} onOpenChange={onOpenChange} title="Novo bloqueio">
      {affected === null ? (
        <form
          noValidate
          className="flex flex-col gap-(--space-16)"
          onSubmit={async (event) => {
            event.preventDefault()
            setTouched(true)
            if (Object.keys(validateException(draft)).length > 0) return
            setBusy(true)
            setError(undefined)
            const result = await onPreview(draft)
            setBusy(false)
            if (typeof result === 'string') {
              setError(result)
            } else if (result.length === 0 || draft.kind === 'ExtraShift') {
              // Turno extra só soma horário: não há o que manter ou cancelar.
              await save('Keep')
            } else {
              setTouched(false)
              setAffected(result)
            }
          }}
        >
          <SelectField
            id="exception-kind"
            label="Tipo"
            value={draft.kind}
            helper={KIND_HELP[draft.kind]}
            options={(Object.keys(KIND_LABELS) as ScheduleExceptionKind[]).map((kind) => ({
              value: kind,
              label: KIND_LABELS[kind],
            }))}
            onChange={(event) => set({ kind: event.target.value as ScheduleExceptionKind })}
          />
          <SelectField
            id="exception-professional"
            label="Para quem"
            value={draft.professionalId ?? ALL}
            error={errors.professionalId}
            options={[
              { value: ALL, label: 'Estabelecimento inteiro' },
              ...professionals.map(({ id, name }) => ({ value: id, label: name })),
            ]}
            onChange={(event) => set({ professionalId: event.target.value || null })}
          />
          <div className="grid grid-cols-2 gap-(--space-12)">
            <TextField
              id="exception-start-date"
              label="Começa em"
              type="date"
              value={draft.startDate}
              error={errors.startDate}
              onChange={(event) => set({ startDate: event.target.value })}
            />
            <TextField
              id="exception-start-time"
              label="Começa às"
              type="time"
              step={900}
              value={draft.startTime}
              onChange={(event) => set({ startTime: event.target.value })}
            />
            <TextField
              id="exception-end-date"
              label="Termina em"
              type="date"
              value={draft.endDate}
              error={errors.endDate}
              onChange={(event) => set({ endDate: event.target.value })}
            />
            <TextField
              id="exception-end-time"
              label="Termina às"
              type="time"
              step={900}
              value={draft.endTime}
              onChange={(event) => set({ endTime: event.target.value })}
            />
          </div>
          <TextField
            id="exception-reason"
            label="Observação interna (opcional)"
            autoComplete="off"
            value={draft.reason ?? ''}
            onChange={(event) => set({ reason: event.target.value || null })}
          />

          {error && (
            <p role="alert" className="type-label text-(--status-rejected-fg)">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? 'Conferindo a agenda…' : 'Continuar'}
          </Button>
        </form>
      ) : (
        <form
          noValidate
          className="flex flex-col gap-(--space-16)"
          onSubmit={(event) => {
            event.preventDefault()
            setTouched(true)
            if (choice === 'CancelAll' && !cancelReason.trim()) return
            void save(choice)
          }}
        >
          <div role="status" className="flex flex-col gap-(--space-8)">
            <p className="type-label text-(--text-strong)">
              {affected.length === 1
                ? '1 agendamento cai neste período'
                : `${affected.length} agendamentos caem neste período`}
            </p>
            <ul className="flex flex-col gap-(--space-4)">
              {affected.map((item) => (
                <li key={item.id} className="type-caption text-(--text-body)">
                  {item.label}
                </li>
              ))}
            </ul>
          </div>

          <fieldset className="flex flex-col gap-(--space-4)">
            <legend className="type-label mb-(--space-4) text-(--text-body)">
              O que fazer com eles
            </legend>
            {(
              [
                ['Keep', 'Manter os agendamentos', 'O bloqueio vale só para pedidos novos.'],
                ['CancelAll', 'Cancelar todos', 'Cancela ou recusa cada um, com o motivo abaixo.'],
              ] as const
            ).map(([value, label, help]) => (
              <label
                key={value}
                className="flex min-h-(--size-touch-min) cursor-pointer items-start gap-(--space-12) py-(--space-8)"
              >
                <input
                  type="radio"
                  name="exception-choice"
                  value={value}
                  checked={choice === value}
                  onChange={() => setChoice(value)}
                  className="mt-(--space-2) size-5 shrink-0 accent-(--action-primary) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)"
                />
                <span className="flex flex-col gap-(--space-2)">
                  <span className="type-label text-(--text-strong)">{label}</span>
                  <span className="type-caption text-(--text-muted)">{help}</span>
                </span>
              </label>
            ))}
          </fieldset>

          {choice === 'CancelAll' && (
            <TextField
              id="exception-cancel-reason"
              label="Motivo do cancelamento"
              autoComplete="off"
              value={cancelReason}
              error={reasonError}
              onChange={(event) => setCancelReason(event.target.value)}
            />
          )}

          {error && (
            <p role="alert" className="type-label text-(--status-rejected-fg)">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-(--space-8)">
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? 'Salvando…' : 'Salvar bloqueio'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="w-full"
              disabled={busy}
              onClick={() => setAffected(null)}
            >
              Voltar e ajustar
            </Button>
          </div>
        </form>
      )}
    </PanelSheet>
  )
}
