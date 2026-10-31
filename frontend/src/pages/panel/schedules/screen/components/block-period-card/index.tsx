import {
  ALL_PROFESSIONALS,
  CARD,
  COMPACT_LABEL,
  KIND_HELP,
  KIND_OPTIONS,
  conflictsTitle,
  newBlock,
  toExceptionDraft,
  validateBlock,
} from '../../consts'
import type { AffectedItem, BlockPeriodValues } from '../../types'
import { BLOCK_FIELD_IDS, FOCUS_ORDER } from './consts'
import { type FormEvent, useState } from 'react'

import type { BlockPeriodCardProps } from './types'
import { Button } from '@components/button'
import { ConfirmDialog } from '@components/confirm-dialog'
import { DateField } from '@components/date-field'
import { MenuSelectField } from '@components/menu-select-field'
import type { RadioOption } from '@components/radio-option-group/types'
import { RadioOptionGroup } from '@components/radio-option-group'
import { SwitchField } from '@components/switch-field'
import { TextField } from '@components/text-field'
import { cn } from 'cn'

const focusField = (id: string) => document.getElementById(id)?.focus()

/** Mudar estes campos não invalida a prévia: são a resposta a ela. */
const ANSWER_FIELDS = new Set<keyof BlockPeriodValues>(['conflictAction', 'cancellationReason'])

/**
 * "Bloquear período" (tela 12): folga, férias, bloqueio ou turno extra, de um profissional ou do estabelecimento
 * inteiro, o dia todo ou com horário. Antes de gravar, a API mostra os agendamentos que caem no período e o Owner
 * decide se ficam todos ou se todos são cancelados, com motivo — bloquear nunca cancela nada em silêncio.
 *
 * Cancelar agendamentos é irreversível e avisa os consumidores: pede confirmação num diálogo. Turno extra soma
 * horário, então não tem prévia. A borda de 2px em `action/primary` do Figma é o estado com foco dentro do cartão.
 */
export const BlockPeriodCard = (props: BlockPeriodCardProps) => {
  const { professionals, defaultTarget, today, onPreview, onConfirm, className } = props

  const [values, setValues] = useState(() => newBlock(defaultTarget))
  const [submitted, setSubmitted] = useState(false)
  const [affected, setAffected] = useState<AffectedItem[] | null>(null)
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  // Trocar de profissional na tela leva o "Para" junto enquanto o formulário não foi começado.
  const [lastDefault, setLastDefault] = useState(defaultTarget)
  if (defaultTarget !== lastDefault) {
    setLastDefault(defaultTarget)
    if (!values.from && !values.to) setValues((current) => ({ ...current, target: defaultTarget }))
  }

  const errors = submitted ? validateBlock(values, today) : {}
  const withHours = values.kind === 'ExtraShift' || !values.allDay
  const count = affected?.length ?? 0

  const setField = <Field extends keyof BlockPeriodValues>(
    field: Field,
    value: BlockPeriodValues[Field],
  ) => {
    setValues((current) => ({
      ...current,
      [field]: value,
      ...(ANSWER_FIELDS.has(field) ? {} : { conflictAction: 'keep', cancellationReason: '' }),
    }))
    if (!ANSWER_FIELDS.has(field)) setAffected(null)
    setError(undefined)
  }

  const targetOptions = [
    ...professionals.map(({ id, name }) => ({ value: id, label: name })),
    { value: ALL_PROFESSIONALS, label: 'Estabelecimento inteiro' },
  ]

  const conflictOptions: ReadonlyArray<RadioOption<BlockPeriodValues['conflictAction']>> = [
    {
      value: 'keep',
      label: 'Manter os existentes',
      description: `Bloqueia apenas horários novos. ${count === 1 ? 'O atendimento acontece' : `Os ${count} atendimentos acontecem`} normalmente.`,
    },
    {
      value: 'cancel',
      label: count === 1 ? 'Cancelar o agendamento' : 'Cancelar todos',
      description: `Cancela ${count === 1 ? 'o agendamento' : `os ${count}`} e avisa ${count === 1 ? 'o consumidor' : 'os consumidores'} com o motivo.`,
    },
  ]

  const save = async (existingAppointments: 'Keep' | 'CancelAll') => {
    setConfirmingCancel(false)
    setBusy(true)
    const failure = await onConfirm(toExceptionDraft(values), {
      existingAppointments,
      cancellationReason:
        existingAppointments === 'CancelAll' ? values.cancellationReason.trim() : null,
    })
    setBusy(false)
    if (failure) return setError(failure)
    setValues(newBlock(defaultTarget))
    setAffected(null)
    setSubmitted(false)
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    const invalid = validateBlock(values, today)
    const first = FOCUS_ORDER.find((field) => invalid[field])
    if (first) return focusField(BLOCK_FIELD_IDS[first])

    if (affected === null && values.kind !== 'ExtraShift') {
      setBusy(true)
      setError(undefined)
      const result = await onPreview(toExceptionDraft(values))
      setBusy(false)
      if (typeof result === 'string') return setError(result)
      if (result.length > 0) return setAffected(result)
    }
    if (count > 0 && values.conflictAction === 'cancel') return setConfirmingCancel(true)
    await save('Keep')
  }

  return (
    <>
      <form
        noValidate
        onSubmit={submit}
        aria-labelledby="block-period-title"
        aria-busy={busy}
        className={cn(
          CARD,
          'gap-(--space-12) transition-shadow focus-within:border-(--action-primary) focus-within:shadow-[0_0_0_1px_var(--action-primary)]',
          className,
        )}
      >
        <h2 id="block-period-title" className="type-label text-(--text-strong)">
          Bloquear período
        </h2>

        <div className="grid grid-cols-1 items-start gap-(--space-8) sm:grid-cols-2">
          <MenuSelectField
            id={BLOCK_FIELD_IDS.kind}
            label="Tipo"
            labelClassName={COMPACT_LABEL}
            value={values.kind}
            options={KIND_OPTIONS}
            onValueChange={(kind) => setField('kind', kind)}
            className="min-w-0"
          />
          <div className="flex min-w-0 flex-col gap-(--space-4)">
            <MenuSelectField
              id={BLOCK_FIELD_IDS.target}
              label="Para"
              labelClassName={COMPACT_LABEL}
              value={values.target}
              options={targetOptions}
              onValueChange={(target) => setField('target', target)}
            />
            {errors.target && (
              <p role="alert" className="type-caption text-(--status-rejected-fg)">
                {errors.target}
              </p>
            )}
          </div>
        </div>
        <p className="type-caption -mt-(--space-4) text-(--text-muted)">{KIND_HELP[values.kind]}</p>

        <div className="grid grid-cols-2 items-start gap-(--space-8)">
          <DateField
            id={BLOCK_FIELD_IDS.from}
            label="De"
            labelClassName={COMPACT_LABEL}
            value={values.from}
            fromDate={today}
            error={errors.from}
            onValueChange={(from) => {
              setField('from', from)
              // Começar depois do fim leva o fim junto, para o período continuar válido.
              if (values.to && values.to < from) setField('to', from)
            }}
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

        {values.kind !== 'ExtraShift' && (
          <SwitchField
            id={BLOCK_FIELD_IDS.allDay}
            label="Dia inteiro"
            description="Desligue para bloquear só algumas horas."
            checked={values.allDay}
            onCheckedChange={(allDay) => setField('allDay', allDay)}
          />
        )}

        {withHours && (
          <div className="grid grid-cols-2 items-start gap-(--space-8)">
            <TextField
              id={BLOCK_FIELD_IDS.startTime}
              label="Início"
              labelClassName={COMPACT_LABEL}
              type="time"
              value={values.startTime}
              error={errors.startTime}
              onChange={(event) => setField('startTime', event.target.value)}
            />
            <TextField
              id={BLOCK_FIELD_IDS.endTime}
              label="Fim"
              labelClassName={COMPACT_LABEL}
              type="time"
              value={values.endTime}
              error={errors.endTime}
              onChange={(event) => setField('endTime', event.target.value)}
            />
          </div>
        )}

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

        {affected && count > 0 && (
          <>
            <div className="flex flex-col gap-(--space-8) rounded-md border border-(--border-interactive) bg-(--bg-surface) p-(--space-12)">
              <p id="block-conflicts-title" className="type-label text-(--text-strong)">
                {conflictsTitle(count)}
              </p>
              <ul aria-labelledby="block-conflicts-title" className="flex flex-col gap-(--space-8)">
                {affected.map((appointment) => (
                  <li key={appointment.id} className="type-caption tabular text-(--text-body)">
                    {appointment.label}
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
            {values.conflictAction === 'cancel' && (
              <TextField
                id={BLOCK_FIELD_IDS.cancellationReason}
                label="Motivo do cancelamento"
                labelClassName={COMPACT_LABEL}
                helper="Aparece para quem tinha horário marcado."
                value={values.cancellationReason}
                error={errors.cancellationReason}
                onChange={(event) => setField('cancellationReason', event.target.value)}
                autoComplete="off"
                maxLength={200}
              />
            )}
          </>
        )}

        {error && (
          <p role="alert" className="type-caption text-(--status-rejected-fg)">
            {error}
          </p>
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
          <Button type="submit" className="flex-1 sm:flex-none" disabled={busy}>
            {busy ? 'Conferindo…' : 'Confirmar bloqueio'}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmingCancel}
        onOpenChange={setConfirmingCancel}
        title={count === 1 ? 'Cancelar o agendamento?' : `Cancelar os ${count} agendamentos?`}
        description={`${count === 1 ? 'O consumidor será avisado' : 'Os consumidores serão avisados'} com o motivo. Isso não pode ser desfeito.`}
        confirmLabel={count === 1 ? 'Bloquear e cancelar' : `Bloquear e cancelar os ${count}`}
        dismissLabel="Voltar ao bloqueio"
        onConfirm={() => void save('CancelAll')}
      />
    </>
  )
}
