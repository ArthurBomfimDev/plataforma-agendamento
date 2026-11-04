import {
  CARD,
  COMPACT_LABEL,
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
import { Checkbox } from '@components/checkbox'
import { ConfirmDialog } from '@components/confirm-dialog'
import { DateField } from '@components/date-field'
import { MenuSelectField } from '@components/menu-select-field'
import type { RadioOption } from '@components/radio-option-group/types'
import { RadioOptionGroup } from '@components/radio-option-group'
import { TextField } from '@components/text-field'
import { cn } from 'cn'

const focusField = (id: string) => document.getElementById(id)?.focus()

/** Mudar estes campos não invalida a prévia: são a resposta a ela. */
const ANSWER_FIELDS = new Set<keyof BlockPeriodValues>(['conflictAction', 'cancellationReason'])

/**
 * "Bloquear período" (tela 12): folga, férias, bloqueio ou turno extra do profissional aberto, de um dia a outro.
 * Antes de gravar, a API mostra os agendamentos que caem no período e o Owner decide se ficam todos ou se todos são
 * cancelados, com motivo — bloquear nunca cancela nada em silêncio.
 *
 * Fora do Figma, no padrão da caixa "Aplicar a todos os dias úteis" da mesma tela: "Dia inteiro" (desmarcada, pede
 * início e fim) e "Estabelecimento inteiro" — o que a API aceita além do wireframe. Turno extra soma horário, então
 * tem sempre horário e não tem prévia.
 *
 * Cancelar agendamentos é irreversível: pede confirmação num diálogo. A borda de 2px em `action/primary` do Figma é
 * o estado com foco dentro do cartão.
 */
export const BlockPeriodCard = (props: BlockPeriodCardProps) => {
  const { professionalId, today, onPreview, onConfirm, className } = props

  const [values, setValues] = useState(newBlock)
  const [submitted, setSubmitted] = useState(false)
  const [affected, setAffected] = useState<AffectedItem[] | null>(null)
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  const errors = submitted ? validateBlock(values, today) : {}
  const extraShift = values.kind === 'ExtraShift'
  const withHours = extraShift || !values.allDay
  const count = affected?.length ?? 0

  const setField = <Field extends keyof BlockPeriodValues>(
    field: Field,
    value: BlockPeriodValues[Field],
  ) => {
    const answer = ANSWER_FIELDS.has(field)
    setValues((current) => ({
      ...current,
      [field]: value,
      ...(answer ? {} : { conflictAction: 'keep', cancellationReason: '' }),
    }))
    if (!answer) setAffected(null)
    setError(undefined)
  }

  const conflictOptions: ReadonlyArray<RadioOption<BlockPeriodValues['conflictAction']>> = [
    {
      value: 'keep',
      label: 'Manter os existentes',
      description: `Bloqueia apenas horários novos. ${count === 1 ? 'O atendimento acontece' : `Os ${count} atendimentos acontecem`} normalmente.`,
    },
    {
      value: 'cancel',
      label: count === 1 ? 'Cancelar o agendamento' : 'Cancelar todos',
      description: `Cancela ${count === 1 ? 'o agendamento' : `os ${count}`}, avisa ${count === 1 ? 'o consumidor' : 'os consumidores'} por e-mail e mostra o motivo no app.`,
    },
  ]

  const save = async (existingAppointments: 'Keep' | 'CancelAll') => {
    setConfirmingCancel(false)
    setBusy(true)
    const failure = await onConfirm(toExceptionDraft(values, professionalId), {
      existingAppointments,
      cancellationReason:
        existingAppointments === 'CancelAll' ? values.cancellationReason.trim() : null,
    })
    setBusy(false)
    if (failure) return setError(failure)
    setValues(newBlock())
    setAffected(null)
    setSubmitted(false)
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    const invalid = validateBlock(values, today)
    const first = FOCUS_ORDER.find((field) => invalid[field])
    if (first) return focusField(BLOCK_FIELD_IDS[first])

    if (affected === null && !extraShift) {
      setBusy(true)
      setError(undefined)
      const result = await onPreview(toExceptionDraft(values, professionalId))
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

        <div className="grid grid-cols-2 items-start gap-(--space-8) sm:grid-cols-3">
          <MenuSelectField
            id={BLOCK_FIELD_IDS.kind}
            label="Tipo"
            labelClassName={COMPACT_LABEL}
            value={values.kind}
            options={KIND_OPTIONS}
            onValueChange={(kind) => setField('kind', kind)}
            className="col-span-2 min-w-0 sm:col-span-1"
          />
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

        <div className="-my-(--space-4) flex flex-col">
          <div className="flex flex-wrap gap-x-(--space-16)">
            {!extraShift && (
              <Checkbox
                id={BLOCK_FIELD_IDS.allDay}
                label="Dia inteiro"
                checked={values.allDay}
                onCheckedChange={(allDay) => setField('allDay', allDay)}
              />
            )}
            <Checkbox
              id={BLOCK_FIELD_IDS.wholeBusiness}
              label="Estabelecimento inteiro"
              checked={values.wholeBusiness}
              onCheckedChange={(wholeBusiness) => setField('wholeBusiness', wholeBusiness)}
              aria-describedby={errors.wholeBusiness ? 'block-whole-business-error' : undefined}
            />
          </div>
          {errors.wholeBusiness && (
            <p
              id="block-whole-business-error"
              role="alert"
              className="type-caption text-(--status-rejected-fg)"
            >
              {errors.wholeBusiness}
            </p>
          )}
        </div>

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
                  <li
                    key={appointment.id}
                    className="type-caption flex items-center gap-(--space-12)"
                  >
                    <span className="tabular w-26 shrink-0 text-(--text-body)">
                      {appointment.when}
                    </span>
                    <span className="min-w-0 flex-1 text-(--text-muted)">{appointment.detail}</span>
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
                helper="Vai no e-mail e aparece para quem tinha horário marcado."
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
        description={`${count === 1 ? 'O consumidor recebe' : 'Os consumidores recebem'} um e-mail com o motivo. Isso não pode ser desfeito.`}
        confirmLabel={count === 1 ? 'Bloquear e cancelar' : `Bloquear e cancelar os ${count}`}
        dismissLabel="Voltar ao bloqueio"
        onConfirm={() => void save('CancelAll')}
      />
    </>
  )
}
