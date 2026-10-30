import { ErrorState, LoadingState } from '@components/screen-state'
import { PANEL_CARD, PanelPage } from '@components/panel-page'
import {
  POLICY_FIELDS,
  horizonLabel,
  horizonOptions,
  toPolicy,
  toPolicyValues,
  validatePolicy,
} from './consts'
import { SelectField } from '@components/select-field'
import type { PolicyValues, SettingsScreenProps } from './types'

import { Button } from '@components/button'
import { SwitchField } from '@components/switch-field'
import { TextField } from '@components/text-field'
import { useState } from 'react'

/**
 * Painel — Configurações (Onda 7D): só o que o backend expõe para o dono mudar, a política de
 * agendamento (`PUT businesses/current/scheduling-policy`). O fuso aparece, mas não muda aqui.
 * Só o dono (`RequireOwner`).
 */
export const SettingsScreen = (props: SettingsScreenProps) => {
  const { data, businessName } = props

  return (
    <PanelPage title="Configurações" subtitle={businessName}>
      {data.status === 'loading' ? (
        <LoadingState label="Carregando as configurações…" />
      ) : data.status === 'error' ? (
        <ErrorState message={data.message} onRetry={data.onRetry} />
      ) : (
        // A chave recomeça o formulário quando a política salva volta da API.
        <PolicyForm
          key={JSON.stringify(data.policy)}
          initial={toPolicyValues(data.policy)}
          timeZone={data.policy.timeZone}
          onSave={props.onSave}
        />
      )}
    </PanelPage>
  )
}

const PolicyForm = (props: {
  initial: PolicyValues
  timeZone: string
  onSave: SettingsScreenProps['onSave']
}) => {
  const { initial, timeZone, onSave } = props
  const [values, setValues] = useState(initial)
  const [touched, setTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()

  const errors = touched ? validatePolicy(values) : {}
  const changed = JSON.stringify(values) !== JSON.stringify(initial)

  return (
    <form
      noValidate
      className="flex flex-col gap-(--space-16)"
      onSubmit={async (event) => {
        event.preventDefault()
        setTouched(true)
        if (Object.keys(validatePolicy(values)).length > 0) return
        setSaving(true)
        setError(undefined)
        const failure = (await onSave?.(toPolicy(values))) ?? null
        setSaving(false)
        if (failure) setError(failure)
      }}
    >
      <section aria-labelledby="settings-confirmation" className={PANEL_CARD}>
        <h2 id="settings-confirmation" className="type-label text-(--text-strong)">
          Confirmação dos pedidos
        </h2>
        <SwitchField
          id="settings-auto-confirm"
          label="Confirmação automática"
          description={
            values.autoConfirm
              ? 'O pedido entra confirmado, sem esperar a sua resposta.'
              : 'Cada pedido espera você aceitar ou recusar.'
          }
          checked={values.autoConfirm}
          onCheckedChange={(autoConfirm) => setValues((current) => ({ ...current, autoConfirm }))}
        />
      </section>

      <section aria-labelledby="settings-deadlines" className={PANEL_CARD}>
        <h2 id="settings-deadlines" className="type-label text-(--text-strong)">
          Prazos
        </h2>
        {POLICY_FIELDS.map(({ field, label, unit, helper }) =>
          field === 'bookingHorizonDays' ? (
            // Opções claras (7CF): é ele que decide se dá para marcar o Natal em outubro. A API aceita de 1 a 365.
            <SelectField
              key={field}
              id={`settings-${field}`}
              label={label}
              helper={`${helper} Um pedido para depois disso é recusado.`}
              value={values[field]}
              options={horizonOptions(Number(values[field])).map((days) => ({
                value: String(days),
                label: horizonLabel(days),
              }))}
              onChange={(event) =>
                setValues((current) => ({ ...current, [field]: event.target.value }))
              }
            />
          ) : (
            <TextField
              key={field}
              id={`settings-${field}`}
              label={`${label} (${unit})`}
              helper={helper}
              inputMode="numeric"
              autoComplete="off"
              value={values[field]}
              error={errors[field]}
              onChange={(event) =>
                setValues((current) => ({ ...current, [field]: event.target.value }))
              }
            />
          ),
        )}
        <p className="type-caption text-(--text-muted)">Horários no fuso {timeZone}.</p>
      </section>

      {error && (
        <p role="alert" className="type-label text-(--status-rejected-fg)">
          {error}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full md:w-auto md:self-start"
        disabled={saving || !changed}
      >
        {saving ? 'Salvando…' : 'Salvar configurações'}
      </Button>
    </form>
  )
}
