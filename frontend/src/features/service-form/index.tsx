import {
  FIELD_IDS,
  SECTION_CARD,
  normalizeMinutes,
  maskPrice,
  sameValues,
  timesOf,
  toServiceDraft,
  validateService,
} from './consts'
import type { ChangeEvent, FormEvent, ReactNode } from 'react'
import type { ServiceFormField, ServiceFormScreenProps, ServiceFormValues } from './types'
import { useCallback, useRef, useState } from 'react'

import { Button } from '@components/button'
import { ConfirmDialog } from '@components/confirm-dialog'
import { OccupancySummary } from './components/occupancy-summary'
import { PANEL_CONTENT_BOTTOM_PADDING } from '@components/panel-bottom-navigation/consts'
import { ProfessionalPicker } from './components/professional-picker'
import { SlotPreview } from './components/slot-preview'
import { TextField } from '@components/text-field'
import { cn } from 'cn'

type TimeField = Extract<
  ServiceFormField,
  'durationMinutes' | 'bufferBeforeMinutes' | 'bufferAfterMinutes'
>

const TIME_FIELDS: ReadonlyArray<{ field: TimeField; label: string; helper: string }> = [
  { field: 'durationMinutes', label: 'Duração', helper: 'Atendimento efetivo' },
  { field: 'bufferBeforeMinutes', label: 'Buffer antes', helper: 'Preparo' },
  { field: 'bufferAfterMinutes', label: 'Buffer depois', helper: 'Limpeza e troca' },
]

const Section = (props: { id: string; title: string; children: ReactNode }) => (
  <section aria-labelledby={props.id} className={SECTION_CARD}>
    <h2 id={props.id} className="type-label text-(--text-strong)">
      {props.title}
    </h2>
    {props.children}
  </section>
)

/**
 * Tela 11 · Painel — Cadastro de serviço (Figma: 11, desktop). Vive dentro do `PanelLayout`: aqui
 * só o conteúdo, ao lado da navegação lateral ou acima da inferior.
 *
 * À direita, o efeito do que está sendo digitado: quanto o serviço bloqueia na agenda e que
 * horários o consumidor veria. TODO(figma): não há frame de 390px; no celular as colunas empilham e
 * as ações vão para o fim do formulário.
 *
 * Os erros só aparecem depois da primeira tentativa de salvar e somem conforme são corrigidos.
 *
 * TODO: salvar depende da API de Catalog; por enquanto a tela só entrega o `ServiceDraft` validado.
 */
export const ServiceFormScreen = (props: ServiceFormScreenProps) => {
  const {
    businessName,
    categoryName,
    professionals,
    initialValues,
    previewHours,
    onSave,
    onCancel,
  } = props

  const formRef = useRef<HTMLFormElement>(null)
  const [values, setValues] = useState(initialValues)
  const [submitted, setSubmitted] = useState(false)
  const [discarding, setDiscarding] = useState(false)

  const errors = submitted ? validateService(values) : {}
  const { duration, bufferBefore, bufferAfter, slotStep } = timesOf(values)
  const subtitle = `${businessName} · ${categoryName}`

  const setField = (field: Exclude<ServiceFormField, 'professionalIds'>, value: string) =>
    setValues((current) => ({ ...current, [field]: value }))

  /** `mask` reescreve a cada tecla; `normalize`, ao sair do campo. */
  const textProps = (
    field: Exclude<ServiceFormField, 'professionalIds'>,
    format: { mask?: (value: string) => string; normalize?: (value: string) => string } = {},
  ) => {
    const { mask, normalize } = format
    return {
      id: FIELD_IDS[field],
      value: values[field],
      error: errors[field],
      onChange: (event: ChangeEvent<HTMLInputElement>) =>
        setField(field, mask ? mask(event.target.value) : event.target.value),
      onBlur: normalize && (() => setField(field, normalize(values[field]))),
    }
  }

  const toggleProfessional = useCallback(
    (professionalId: string) =>
      setValues((current: ServiceFormValues) => ({
        ...current,
        professionalIds: current.professionalIds.includes(professionalId)
          ? current.professionalIds.filter((id) => id !== professionalId)
          : [...current.professionalIds, professionalId],
      })),
    [],
  )

  const focusFirstError = (fields: ServiceFormField[]) => {
    const target = formRef.current?.querySelector(`#${FIELD_IDS[fields[0]]}`)
    const focusable =
      target instanceof HTMLFieldSetElement ? target.querySelector('button') : target
    if (focusable instanceof HTMLElement) focusable.focus()
  }

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    const invalid = (Object.keys(FIELD_IDS) as ServiceFormField[]).filter(
      (field) => validateService(values)[field],
    )
    if (invalid.length > 0) return focusFirstError(invalid)
    onSave?.(toServiceDraft(values))
  }

  const cancel = () => (sameValues(values, initialValues) ? onCancel?.() : setDiscarding(true))

  const discard = () => {
    setDiscarding(false)
    setValues(initialValues)
    setSubmitted(false)
    onCancel?.()
  }

  const actions = (size: 'md' | 'lg') => (
    <>
      <Button
        type="button"
        variant="secondary"
        size={size}
        className={size === 'lg' ? 'flex-1' : 'shrink-0'}
        onClick={cancel}
      >
        Cancelar
      </Button>
      <Button type="submit" size={size} className={size === 'lg' ? 'flex-1' : 'shrink-0'}>
        Salvar serviço
      </Button>
    </>
  )

  return (
    <>
      {/* Celular e tablet */}
      <header className="sticky top-0 z-10 border-b border-(--border-subtle) bg-(--bg-surface) pt-[calc(var(--space-16)+env(safe-area-inset-top))] pb-(--space-12) lg:hidden">
        <div className="flex flex-col gap-(--space-2) px-(--space-16) md:mx-auto md:max-w-160">
          <h1 className="type-heading text-(--text-strong)">Novo serviço</h1>
          <p className="type-caption text-(--text-muted)">{subtitle}</p>
        </div>
      </header>

      <form
        ref={formRef}
        noValidate
        onSubmit={save}
        aria-label="Novo serviço"
        className={cn(
          'flex flex-col gap-(--space-12) px-(--space-16) pt-(--space-12) md:mx-auto md:max-w-160 lg:mx-0 lg:max-w-none lg:px-(--space-24) lg:pt-(--space-20)',
          PANEL_CONTENT_BOTTOM_PADDING,
        )}
      >
        {/* Desktop (11) */}
        <div className="hidden items-center gap-(--space-12) lg:flex">
          <div className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
            <h1 className="type-title text-(--text-strong)">Novo serviço</h1>
            <p className="type-caption text-(--text-muted)">{subtitle}</p>
          </div>
          {actions('md')}
        </div>

        <div className="flex flex-col gap-(--space-12) xl:flex-row xl:items-start xl:gap-(--space-16)">
          <div className="flex min-w-0 flex-1 flex-col gap-(--space-12)">
            <Section id="service-identification" title="Identificação">
              <TextField {...textProps('name')} label="Nome do serviço" autoComplete="off" />
              <TextField
                {...textProps('description')}
                label="Descrição"
                placeholder="Descreva o que está incluído"
                autoComplete="off"
              />
            </Section>

            <Section id="service-time" title="Tempo">
              <div className="grid grid-cols-3 gap-(--space-12)">
                {TIME_FIELDS.map(({ field, label, helper }) => (
                  <TextField
                    key={field}
                    {...textProps(field, { normalize: normalizeMinutes })}
                    label={label}
                    helper={helper}
                    inputMode="numeric"
                    autoComplete="off"
                    className="min-w-0"
                  />
                ))}
              </div>
              <TextField
                {...textProps('slotStepMinutes', { normalize: normalizeMinutes })}
                label="Granularidade dos horários"
                helper="Define de quanto em quanto tempo os horários aparecem para o consumidor"
                inputMode="numeric"
                autoComplete="off"
              />
            </Section>

            <Section id="service-price" title="Preço e profissionais">
              <TextField
                {...textProps('price', { mask: maskPrice })}
                label="Preço"
                placeholder="R$ 0,00"
                helper="O preço vira snapshot no agendamento — reajuste não altera o histórico"
                // A máscara só lê dígitos: o teclado numérico basta, sem vírgula.
                inputMode="numeric"
                autoComplete="off"
              />
              <ProfessionalPicker
                id={FIELD_IDS.professionalIds}
                professionals={professionals}
                selectedIds={values.professionalIds}
                onToggle={toggleProfessional}
                error={errors.professionalIds}
              />
            </Section>
          </div>

          <aside
            aria-label="Pré-visualização do serviço"
            className="flex flex-col gap-(--space-12) xl:sticky xl:top-(--space-24) xl:w-80 xl:shrink-0"
          >
            <OccupancySummary
              bufferBefore={bufferBefore}
              duration={duration}
              bufferAfter={bufferAfter}
            />
            <SlotPreview
              hours={previewHours}
              // Sem duração não há serviço para encaixar: só os buffers não viram horário.
              occupancy={duration > 0 ? bufferBefore + duration + bufferAfter : 0}
              step={slotStep}
            />
          </aside>
        </div>

        {/* Celular e tablet: ações no fim do formulário. */}
        <div className="flex gap-(--space-8) lg:hidden">{actions('lg')}</div>
      </form>

      <ConfirmDialog
        open={discarding}
        onOpenChange={setDiscarding}
        title="Descartar o novo serviço?"
        description="O que você preencheu neste formulário será perdido."
        confirmLabel="Descartar serviço"
        dismissLabel="Continuar editando"
        onConfirm={discard}
      />
    </>
  )
}
