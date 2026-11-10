import {
  CATEGORY_OPTIONS,
  COUNCIL_OPTIONS,
  STEP_LABELS,
  TERMS_TEXT,
  type FieldErrors,
  POSTAL_CODE_INVALID_FOR_LOOKUP,
  POSTAL_CODE_PATTERN,
  hasErrors,
  nextStep,
  postalCodeFeedback,
  previousStep,
  stepsFor,
  validateAddress,
  validateBusiness,
  validateResponsible,
} from './consts'
import type {
  AddressValues,
  BusinessValues,
  DocumentValues,
  RegisterScreenProps,
  ResponsibleValues,
  StepResult,
  WizardStep,
} from './types'
import { useState } from 'react'

import { AddressLocation } from './components/address-location'
import type { LocationCheck } from './components/address-location/consts'
import type { BusinessCategoryName, GeoPlaceResponse } from '@api/models'
import { Button } from '@components/button'
import { Checkbox } from '@components/checkbox'
import { type BusinessDocumentType, documentTypeError } from './components/document-step/consts'
import { DocumentStep } from './components/document-step'
import { RadioOptionGroup } from '@components/radio-option-group'
import { SelectField } from '@components/select-field'
import { TextField } from '@components/text-field'
import { ThemeToggle } from '@components/theme-toggle'

const EMPTY_ADDRESS: AddressValues = {
  postalCode: '',
  street: '',
  streetNumber: '',
  district: '',
  city: '',
  state: '',
}

/**
 * Cadastrar meu estabelecimento (ondas finais, Fase 3). Mobile primeiro: um passo por vez, botão de rodapé de largura
 * total. Negócio → Documento (cria o rascunho) → Endereço e localização → Responsável (só Saúde) → Revisão e termos.
 * O progresso fica no servidor: sair no meio deixa o rascunho, e o painel mostra o que falta.
 *
 * TODO(figma): não há wireframe desta tela; segue os tokens e o desenho das telas de conta.
 */
export const RegisterBusinessScreen = (props: RegisterScreenProps) => {
  const { initialStep, createdCategory, savedAddress, onLeave } = props

  const [step, setStep] = useState<WizardStep>(initialStep ?? 'business')
  const [business, setBusiness] = useState<BusinessValues>({
    name: '',
    category: createdCategory ?? 'Beleza',
  })
  const [documentValues, setDocumentValues] = useState<DocumentValues>({
    document: '',
    documentType: 'Cnpj',
    isMei: false,
  })
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  const category: BusinessCategoryName = business.category
  const steps = stepsFor(category)
  const position = steps.indexOf(step) + 1

  // Roda uma etapa assíncrona: mostra o erro do servidor ou segue para o passo seguinte.
  const run = async (task: () => StepResult, onDone: () => void) => {
    setError(undefined)
    setBusy(true)
    const failure = await task()
    setBusy(false)
    if (failure) setError(failure)
    else onDone()
  }

  const goNext = () => setStep((current) => nextStep(category, current))
  const goBack = () => setStep((current) => previousStep(category, current))

  return (
    <main className="min-h-dvh bg-(--bg-page) px-(--space-16) pt-[calc(var(--space-24)+env(safe-area-inset-top))] pb-[calc(var(--space-24)+env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-120 flex-col gap-(--space-16)">
        <header className="flex flex-col gap-(--space-4)">
          <div className="flex items-center justify-between gap-(--space-12)">
            <p className="type-caption tabular min-w-0 text-(--text-muted)">
              Passo {position} de {steps.length} · {STEP_LABELS[step]}
            </p>
            <ThemeToggle />
          </div>
          <h1 className="type-heading text-(--text-strong)">Cadastrar meu estabelecimento</h1>
          <ol aria-label="Passos do cadastro" className="flex gap-(--space-4)">
            {steps.map((item, index) => (
              <li
                key={item}
                aria-current={item === step ? 'step' : undefined}
                className={`h-1 flex-1 rounded-full ${index < position ? 'bg-(--text-link)' : 'bg-(--border-subtle)'}`}
              >
                <span className="sr-only">{STEP_LABELS[item]}</span>
              </li>
            ))}
          </ol>
        </header>

        {step === 'business' && (
          <BusinessStep
            values={business}
            locked={createdCategory !== undefined}
            onChange={setBusiness}
            onNext={goNext}
          />
        )}

        {step === 'document' && (
          <DocumentForm
            values={documentValues}
            busy={busy}
            error={error}
            onChange={setDocumentValues}
            onBack={goBack}
            onSubmit={() => run(() => props.onCreate(business, documentValues), goNext)}
          />
        )}

        {step === 'address' && (
          <AddressStep
            initial={{ ...EMPTY_ADDRESS, ...savedAddress }}
            busy={busy}
            error={error}
            onLookupPostalCode={props.onLookupPostalCode}
            onLocate={props.onLocateAddress}
            onConfirm={(place) => run(() => props.onConfirmLocation(place), goNext)}
          />
        )}

        {step === 'responsible' && (
          <ResponsibleStep
            busy={busy}
            error={error}
            onBack={goBack}
            onSubmit={(responsible) => run(() => props.onSaveResponsible(responsible), goNext)}
          />
        )}

        {step === 'review' && (
          <ReviewStep
            name={business.name}
            category={category}
            busy={busy}
            error={error}
            onBack={goBack}
            onSubmit={() => run(props.onFinish, onLeave)}
          />
        )}

        {step !== 'review' && (
          <Button variant="ghost" onClick={onLeave}>
            Continuar depois
          </Button>
        )}
      </div>
    </main>
  )
}

const Problem = ({ message }: { message?: string }) =>
  message ? (
    <p role="alert" className="type-label text-(--status-rejected-fg)">
      {message}
    </p>
  ) : null

const BusinessStep = (props: {
  values: BusinessValues
  locked: boolean
  onChange: (values: BusinessValues) => void
  onNext: () => void
}) => {
  const { values, locked, onChange, onNext } = props
  const [errors, setErrors] = useState<FieldErrors<BusinessValues>>({})

  return (
    <form
      noValidate
      className="flex flex-col gap-(--space-16)"
      onSubmit={(event) => {
        event.preventDefault()
        const found = validateBusiness(values)
        setErrors(found)
        if (!hasErrors(found)) onNext()
      }}
    >
      <TextField
        id="business-name"
        label="Nome do estabelecimento"
        autoComplete="organization"
        value={values.name}
        error={errors.name}
        onChange={(event) => onChange({ ...values, name: event.target.value })}
      />

      <fieldset className="flex flex-col gap-(--space-8)" disabled={locked}>
        <legend className="type-label mb-(--space-8) text-(--text-body)">Categoria</legend>
        <RadioOptionGroup
          aria-label="Categoria do estabelecimento"
          value={values.category}
          options={CATEGORY_OPTIONS}
          onValueChange={(category) => onChange({ ...values, category })}
        />
      </fieldset>

      <Button type="submit" size="lg" className="w-full">
        Continuar
      </Button>
    </form>
  )
}

const DocumentForm = (props: {
  values: DocumentValues
  busy: boolean
  error?: string
  onChange: (values: DocumentValues) => void
  onBack: () => void
  onSubmit: () => void
}) => {
  const { values, busy, error, onChange, onBack, onSubmit } = props
  const [fieldError, setFieldError] = useState<string>()

  const change = (patch: Partial<DocumentValues>) => {
    setFieldError(undefined)
    onChange({ ...values, ...patch })
  }

  return (
    <form
      noValidate
      className="flex flex-col gap-(--space-16)"
      onSubmit={(event) => {
        event.preventDefault()
        const found = documentTypeError(values.document, values.documentType)
        setFieldError(found)
        if (!found) onSubmit()
      }}
    >
      <DocumentStep
        type={values.documentType}
        value={values.document}
        isMei={values.isMei}
        error={fieldError}
        // MEI só existe com CNPJ: trocar para CPF desfaz a marca.
        onTypeChange={(documentType: BusinessDocumentType) =>
          change({ documentType, isMei: documentType === 'Cnpj' && values.isMei })
        }
        onChange={(document) => change({ document })}
        onMeiChange={(isMei) => change({ isMei })}
      />
      <Problem message={error} />
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? 'Criando…' : 'Criar e continuar'}
      </Button>
      <Button variant="ghost" onClick={onBack} disabled={busy}>
        Voltar
      </Button>
    </form>
  )
}

const AddressStep = (props: {
  initial: AddressValues
  busy: boolean
  error?: string
  onLookupPostalCode: RegisterScreenProps['onLookupPostalCode']
  onLocate: RegisterScreenProps['onLocateAddress']
  onConfirm: (place: GeoPlaceResponse) => void
}) => {
  const { initial, busy, error, onLookupPostalCode, onLocate, onConfirm } = props
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState<FieldErrors<AddressValues>>({})
  const [lookupMessage, setLookupMessage] = useState<string>()
  const [lookingUp, setLookingUp] = useState(false)
  const [check, setCheck] = useState<LocationCheck>({ status: 'idle' })

  const locate = async () => {
    setCheck({ status: 'loading' })
    setCheck(await onLocate(values))
  }

  const field = (name: keyof AddressValues) => ({
    value: values[name],
    error: errors[name],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues((current) => ({ ...current, [name]: event.target.value }))
      setErrors((current) => ({ ...current, [name]: undefined }))
    },
  })

  const lookup = async () => {
    setLookupMessage(undefined)
    if (!POSTAL_CODE_PATTERN.test(values.postalCode.trim())) {
      setErrors((current) => ({ ...current, postalCode: POSTAL_CODE_INVALID_FOR_LOOKUP }))
      return
    }
    setLookingUp(true)
    const found = await onLookupPostalCode(values.postalCode)
    setLookingUp(false)
    const feedback = postalCodeFeedback(found)
    setLookupMessage(feedback.message)
    if (found) {
      setValues((current) => ({
        ...current,
        street: found.street ?? current.street,
        district: found.district ?? current.district,
        city: found.city,
        state: found.state,
      }))
      // Os campos preenchidos podiam estar com erro da tentativa anterior.
      setErrors((current) => ({
        ...current,
        postalCode: undefined,
        street: found.street ? undefined : current.street,
        district: found.district ? undefined : current.district,
        city: undefined,
        state: undefined,
      }))
    }
    document
      .getElementById(feedback.focus === 'number' ? 'business-number' : 'business-street')
      ?.focus()
  }

  if (check.status !== 'idle') {
    return (
      <AddressLocation
        check={check}
        busy={busy}
        error={error}
        onConfirm={onConfirm}
        onRetry={() => void locate()}
        onEdit={() => setCheck({ status: 'idle' })}
      />
    )
  }

  return (
    <form
      noValidate
      className="flex flex-col gap-(--space-12)"
      onSubmit={(event) => {
        event.preventDefault()
        const found = validateAddress(values)
        setErrors(found)
        if (!hasErrors(found)) void locate()
      }}
    >
      <p className="type-body text-(--text-muted)">
        O endereço define onde o estabelecimento aparece na busca. A localização é confirmada a
        partir dele.
      </p>
      <div className="flex items-end gap-(--space-8)">
        <TextField
          id="business-postal-code"
          label="CEP"
          inputMode="numeric"
          autoComplete="postal-code"
          className="min-w-0 flex-1"
          {...field('postalCode')}
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => void lookup()}
          disabled={busy || lookingUp}
        >
          {lookingUp ? 'Buscando…' : 'Buscar CEP'}
        </Button>
      </div>
      <p role="status" className="type-caption text-(--text-muted) empty:hidden">
        {lookupMessage}
      </p>
      <TextField
        id="business-street"
        label="Rua"
        autoComplete="address-line1"
        {...field('street')}
      />
      <TextField id="business-number" label="Número" {...field('streetNumber')} />
      <TextField id="business-district" label="Bairro" {...field('district')} />
      <TextField
        id="business-city"
        label="Cidade"
        autoComplete="address-level2"
        {...field('city')}
      />
      <TextField
        id="business-state"
        label="UF"
        maxLength={2}
        autoCapitalize="characters"
        autoComplete="address-level1"
        {...field('state')}
      />
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        Salvar e confirmar a localização
      </Button>
    </form>
  )
}

const ResponsibleStep = (props: {
  busy: boolean
  error?: string
  onBack: () => void
  onSubmit: (values: ResponsibleValues) => void
}) => {
  const { busy, error, onBack, onSubmit } = props
  const [values, setValues] = useState<ResponsibleValues>({
    name: '',
    council: 'Crm',
    councilNumber: '',
    councilState: '',
  })
  const [errors, setErrors] = useState<FieldErrors<ResponsibleValues>>({})

  const text = (name: 'name' | 'councilNumber' | 'councilState') => ({
    value: values[name],
    error: errors[name],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues((current) => ({ ...current, [name]: event.target.value }))
      setErrors((current) => ({ ...current, [name]: undefined }))
    },
  })

  return (
    <form
      noValidate
      className="flex flex-col gap-(--space-12)"
      onSubmit={(event) => {
        event.preventDefault()
        const found = validateResponsible(values)
        setErrors(found)
        if (!hasErrors(found)) onSubmit(values)
      }}
    >
      <p className="type-body text-(--text-muted)">
        Em Saúde, um administrador confere o registro no conselho antes de o estabelecimento
        aparecer. Só ele vê estes dados.
      </p>
      <TextField
        id="responsible-name"
        label="Profissional responsável"
        autoComplete="name"
        {...text('name')}
      />
      <SelectField
        id="responsible-council"
        label="Conselho"
        options={COUNCIL_OPTIONS}
        value={values.council}
        onChange={(event) =>
          setValues((current) => ({
            ...current,
            council: event.target.value as ResponsibleValues['council'],
          }))
        }
      />
      <TextField id="responsible-number" label="Número do registro" {...text('councilNumber')} />
      <TextField
        id="responsible-state"
        label="UF do registro"
        maxLength={2}
        autoCapitalize="characters"
        {...text('councilState')}
      />
      <Problem message={error} />
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? 'Salvando…' : 'Continuar'}
      </Button>
      <Button variant="ghost" onClick={onBack} disabled={busy}>
        Voltar
      </Button>
    </form>
  )
}

const ReviewStep = (props: {
  name: string
  category: BusinessCategoryName
  busy: boolean
  error?: string
  onBack: () => void
  onSubmit: () => void
}) => {
  const { name, category, busy, error, onBack, onSubmit } = props
  const [accepted, setAccepted] = useState(false)
  const [needsTerms, setNeedsTerms] = useState(false)

  return (
    <form
      noValidate
      className="flex flex-col gap-(--space-16)"
      onSubmit={(event) => {
        event.preventDefault()
        setNeedsTerms(!accepted)
        if (accepted) onSubmit()
      }}
    >
      <section className="flex flex-col gap-(--space-4) rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-(--space-16)">
        <h2 className="type-label text-(--text-strong)">{name || 'Seu estabelecimento'}</h2>
        <p className="type-caption text-(--text-muted)">
          {category === 'Saude'
            ? 'Saúde: depois de configurar serviços, equipe e jornadas, você envia para análise.'
            : 'Beleza: depois de configurar serviços, equipe e jornadas, você publica na hora.'}
        </p>
      </section>

      <section aria-labelledby="terms-title" className="flex flex-col gap-(--space-8)">
        <h2 id="terms-title" className="type-label text-(--text-strong)">
          Termos
        </h2>
        <p className="type-caption text-(--text-muted)">
          Texto provisório, ainda sem revisão jurídica.
        </p>
        <ul className="type-body flex list-disc flex-col gap-(--space-4) pl-(--space-16) text-(--text-body)">
          {TERMS_TEXT.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <Checkbox
          label="Li e aceito os termos"
          checked={accepted}
          onCheckedChange={(checked) => {
            setAccepted(checked === true)
            if (checked) setNeedsTerms(false)
          }}
        />
        <Problem message={needsTerms ? 'Aceite os termos para continuar.' : undefined} />
      </section>

      <Problem message={error} />
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? 'Salvando…' : 'Salvar e ir para o painel'}
      </Button>
      <Button variant="ghost" onClick={onBack} disabled={busy}>
        Voltar
      </Button>
    </form>
  )
}
