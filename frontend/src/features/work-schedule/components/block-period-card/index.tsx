import {
  BLOCK_TYPE_OPTIONS,
  CARD,
  COMPACT_LABEL,
  EMPTY_BLOCK,
  appointmentWhenLabel,
  conflictsIn,
  conflictsTitle,
  toBlockDraft,
  validateBlock,
} from '../../consts'
import type { BlockConflictAction, BlockPeriodValues } from '../../types'
import type { RadioOption } from '@components/radio-option-group/types'
import { type FormEvent, useMemo, useState } from 'react'

import { BLOCK_FIELD_IDS } from './consts'
import type { BlockPeriodCardProps } from './types'
import { Button } from '@components/button'
import { ConfirmDialog } from '@components/confirm-dialog'
import { DateField } from '@components/date-field'
import { RadioOptionGroup } from '@components/radio-option-group'
import { SelectField } from '@components/select-field'
import { TextField } from '@components/text-field'
import { cn } from 'cn'

const focusField = (id: string) => document.getElementById(id)?.focus()

/**
 * "Bloquear período" (tela 12): folga, férias ou bloqueio de um profissional, de um dia a outro.
 * Os agendamentos já confirmados no período aparecem antes de confirmar, e o Owner decide se ficam
 * ou se são cancelados — bloquear nunca cancela nada em silêncio.
 *
 * Cancelar agendamentos é irreversível e avisa os consumidores: pede confirmação num diálogo.
 * A borda de 2px em `action/primary` do Figma é o estado com foco dentro do cartão.
 */
export const BlockPeriodCard = (props: BlockPeriodCardProps) => {
  const { professionalId, appointments, today, initialValues, onConfirm, className } = props

  const [values, setValues] = useState(initialValues)
  const [submitted, setSubmitted] = useState(false)
  const [confirmingCancel, setConfirmingCancel] = useState(false)

  const errors = submitted ? validateBlock(values, today) : {}
  const conflicts = useMemo(
    () => conflictsIn(appointments, professionalId, values.from, values.to),
    [appointments, professionalId, values.from, values.to],
  )
  const count = conflicts.length

  const setField = <Field extends keyof BlockPeriodValues>(
    field: Field,
    value: BlockPeriodValues[Field],
  ) => setValues((current) => ({ ...current, [field]: value }))

  const conflictOptions: ReadonlyArray<RadioOption<BlockConflictAction>> = [
    {
      value: 'keep',
      label: 'Manter os existentes',
      description: `Bloqueia apenas horários novos. ${count === 1 ? 'O atendimento acontece' : `Os ${count} atendimentos acontecem`} normalmente.`,
    },
    {
      value: 'cancel',
      label: count === 1 ? 'Cancelar o agendamento' : 'Cancelar todos',
      description: `Cancela ${count === 1 ? 'o agendamento' : `os ${count}`} e notifica ${count === 1 ? 'o consumidor' : 'os consumidores'} por e-mail e no app.`,
    },
  ]

  const finish = () => {
    setConfirmingCancel(false)
    onConfirm(toBlockDraft(values, professionalId, conflicts))
    setValues(EMPTY_BLOCK)
    setSubmitted(false)
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    const invalid = validateBlock(values, today)
    if (invalid.from) return focusField(BLOCK_FIELD_IDS.from)
    if (invalid.to) return focusField(BLOCK_FIELD_IDS.to)
    if (count > 0 && values.conflictAction === 'cancel') return setConfirmingCancel(true)
    finish()
  }

  return (
    <>
      <form
        noValidate
        onSubmit={submit}
        aria-labelledby="block-period-title"
        className={cn(
          CARD,
          'gap-(--space-12) transition-shadow focus-within:border-(--action-primary) focus-within:shadow-[0_0_0_1px_var(--action-primary)]',
          className,
        )}
      >
        <h2 id="block-period-title" className="type-label text-(--text-strong)">
          Bloquear período
        </h2>

        <div className="grid grid-cols-2 items-start gap-(--space-8) sm:grid-cols-3">
          <SelectField
            id={BLOCK_FIELD_IDS.type}
            label="Tipo"
            labelClassName={COMPACT_LABEL}
            value={values.type}
            options={BLOCK_TYPE_OPTIONS}
            onValueChange={(type) => setField('type', type)}
            className="col-span-2 min-w-0 sm:col-span-1"
          />
          <DateField
            id={BLOCK_FIELD_IDS.from}
            label="De"
            labelClassName={COMPACT_LABEL}
            value={values.from}
            fromDate={today}
            error={errors.from}
            onValueChange={(from) =>
              setValues((current) => ({
                ...current,
                from,
                // Começar depois do fim leva o fim junto, para o período continuar válido.
                to: current.to && current.to < from ? from : current.to,
              }))
            }
            className="min-w-0"
          />
          <DateField
            id={BLOCK_FIELD_IDS.to}
            label="Até"
            labelClassName={COMPACT_LABEL}
            value={values.to}
            fromDate={values.from || today}
            error={errors.to}
            onValueChange={(to) => setField('to', to)}
            className="min-w-0"
          />
        </div>

        <TextField
          id={BLOCK_FIELD_IDS.reason}
          label="Motivo"
          labelClassName={COMPACT_LABEL}
          placeholder="— opcional"
          value={values.reason}
          onChange={(event) => setField('reason', event.target.value)}
          autoComplete="off"
          maxLength={200}
        />

        {count > 0 && (
          <>
            <div className="flex flex-col gap-(--space-8) rounded-md border border-(--border-interactive) bg-(--bg-surface) p-(--space-12)">
              <p id="block-conflicts-title" className="type-label text-(--text-strong)">
                {conflictsTitle(count)}
              </p>
              <ul aria-labelledby="block-conflicts-title" className="flex flex-col gap-(--space-8)">
                {conflicts.map((appointment) => (
                  <li
                    key={appointment.id}
                    className="type-caption flex items-center gap-(--space-12)"
                  >
                    <span className="tabular w-26 shrink-0 text-(--text-body)">
                      {appointmentWhenLabel(appointment)}
                    </span>
                    <span className="min-w-0 flex-1 text-(--text-muted)">
                      {appointment.customerName} · {appointment.serviceName}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <p id="block-conflict-action" className="type-label text-(--text-strong)">
              O que fazer com {count === 1 ? 'ele' : 'eles'}?
            </p>
            <RadioOptionGroup
              aria-labelledby="block-conflict-action"
              value={values.conflictAction}
              options={conflictOptions}
              onValueChange={(action) => setField('conflictAction', action)}
            />
          </>
        )}

        <div className="flex items-center gap-(--space-8)">
          <div className="hidden flex-1 sm:block" />
          <Button
            type="button"
            variant="ghost"
            className="flex-1 sm:flex-none"
            onClick={() => focusField(BLOCK_FIELD_IDS.from)}
          >
            Voltar e ajustar
          </Button>
          <Button type="submit" className="flex-1 sm:flex-none">
            Confirmar bloqueio
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmingCancel}
        onOpenChange={setConfirmingCancel}
        title={count === 1 ? 'Cancelar o agendamento?' : `Cancelar os ${count} agendamentos?`}
        description={`${count === 1 ? 'O consumidor será avisado' : 'Os consumidores serão avisados'} por e-mail e no app. Isso não pode ser desfeito.`}
        confirmLabel={count === 1 ? 'Bloquear e cancelar' : `Bloquear e cancelar os ${count}`}
        dismissLabel="Voltar ao bloqueio"
        onConfirm={finish}
      />
    </>
  )
}
