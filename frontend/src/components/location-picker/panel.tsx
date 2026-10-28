import { ChevronRight, Hash, LocateFixed, MapPin, Search, TriangleAlert } from 'lucide-react'
import { formatDistance, formatPostalCode, postalCodeDigits } from './consts'

import { Button } from '@components/button'
import type { LocationPickerPanelProps } from './types'
import type { ReactNode } from 'react'
import { TextField } from '@components/text-field'
import { useState } from 'react'

/** Opção do menu: linha inteira clicável, alvo ≥ 44 px, ícone decorativo. */
const Option = ({
  icon,
  label,
  hint,
  onClick,
}: {
  icon: ReactNode
  label: string
  hint?: string
  onClick?: () => void
}) => (
  <li>
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-(--size-touch-min) w-full items-center gap-(--space-12) rounded-md px-(--space-12) py-(--space-12) text-left hover:bg-(--bg-surface-raised) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)"
    >
      <span aria-hidden="true" className="text-(--text-link)">
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="type-label text-(--text-strong)">{label}</span>
        {hint && <span className="type-caption text-(--text-muted)">{hint}</span>}
      </span>
      <ChevronRight aria-hidden="true" className="size-4 text-(--text-muted)" />
    </button>
  </li>
)

/** Volta ao menu: toda tela do seletor tem saída. */
const Back = ({ onStep }: Pick<LocationPickerPanelProps, 'onStep'>) => (
  <Button variant="ghost" className="w-full" onClick={() => onStep?.('menu')}>
    Escolher de outro jeito
  </Button>
)

const ErrorText = ({ error }: { error?: string }) =>
  error ? (
    <p role="alert" className="type-label text-(--status-rejected-fg)">
      {error}
    </p>
  ) : null

/**
 * Conteúdo do seletor de localização, um passo por vez (Onda 6B). Só apresentação: quem pede a posição, chama a
 * API e guarda a escolha é o `LocationPicker`.
 */
export const LocationPickerPanel = (props: LocationPickerPanelProps) => {
  const {
    step,
    current,
    busy,
    error,
    accuracyMeters,
    postalCodeMatch,
    results,
    onStep,
    onAskDevice,
    onUsePoorAnyway,
    onUseDemo,
    onSubmitPostalCode,
    onUsePostalCodeMatch,
    onSubmitSearch,
    onPickResult,
  } = props

  const [postalCode, setPostalCode] = useState('')
  const [postalCodeError, setPostalCodeError] = useState<string>()
  const [text, setText] = useState('')
  const [textError, setTextError] = useState<string>()

  if (step === 'menu') {
    return (
      <div className="flex flex-col gap-(--space-12)">
        {current && (
          <p className="type-caption text-(--text-muted)">
            Agora: <span className="text-(--text-strong)">{current.label}</span>
          </p>
        )}
        <ul className="flex flex-col gap-(--space-4)">
          <Option
            icon={<LocateFixed className="size-5" />}
            label="Usar minha localização"
            hint="O navegador pergunta antes"
            onClick={() => onStep?.('device-notice')}
          />
          <Option
            icon={<Hash className="size-5" />}
            label="Buscar por CEP"
            onClick={() => onStep?.('postal-code')}
          />
          <Option
            icon={<Search className="size-5" />}
            label="Endereço, bairro ou cidade"
            onClick={() => onStep?.('search')}
          />
          <Option
            icon={<MapPin className="size-5" />}
            label="Garça, SP (demonstração)"
            hint="Onde estão os estabelecimentos de exemplo"
            onClick={onUseDemo}
          />
        </ul>
      </div>
    )
  }

  if (step === 'device-notice') {
    return (
      <div className="flex flex-col gap-(--space-16)">
        <p className="type-body text-(--text-body)">
          Para mostrar o que está perto de você, o navegador vai pedir sua localização.
        </p>
        <p className="type-body text-(--text-muted)">
          Usamos só agora, para buscar. Guardamos apenas o bairro aproximado neste aparelho, nunca o
          ponto exato, e você pode trocar quando quiser.
        </p>
        <Button size="lg" className="w-full" onClick={onAskDevice}>
          Continuar
        </Button>
        <Back onStep={onStep} />
      </div>
    )
  }

  if (step === 'device-pending') {
    return (
      <p role="status" className="type-body text-(--text-muted)">
        Aguardando a resposta do navegador…
      </p>
    )
  }

  if (step === 'device-poor') {
    return (
      <div className="flex flex-col gap-(--space-16)">
        <p role="alert" className="type-body flex items-start gap-(--space-8) text-(--text-body)">
          <TriangleAlert
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-(--status-pending-fg)"
          />
          O navegador informou sua posição com precisão de cerca de{' '}
          {formatDistance(accuracyMeters ?? 0)}. Os resultados podem não estar tão perto.
        </p>
        <Button size="lg" className="w-full" onClick={onUsePoorAnyway}>
          Usar mesmo assim
        </Button>
        <Button
          size="lg"
          variant="secondary"
          className="w-full"
          onClick={() => onStep?.('postal-code')}
        >
          Buscar por CEP
        </Button>
        <Back onStep={onStep} />
      </div>
    )
  }

  if (step === 'device-denied' || step === 'device-failed') {
    return (
      <div className="flex flex-col gap-(--space-16)">
        <p role="alert" className="type-body text-(--text-body)">
          {step === 'device-denied'
            ? 'Você não permitiu o acesso à localização. Sem problema: busque pelo CEP ou pela cidade.'
            : 'Não conseguimos sua localização agora. Busque pelo CEP ou pela cidade.'}
        </p>
        <Button size="lg" className="w-full" onClick={() => onStep?.('postal-code')}>
          Buscar por CEP
        </Button>
        <Button size="lg" variant="secondary" className="w-full" onClick={() => onStep?.('search')}>
          Endereço, bairro ou cidade
        </Button>
        {step === 'device-failed' && (
          <Button variant="ghost" className="w-full" onClick={onAskDevice}>
            Tentar de novo
          </Button>
        )}
      </div>
    )
  }

  if (step === 'postal-code') {
    return (
      <div className="flex flex-col gap-(--space-16)">
        <form
          noValidate
          className="flex flex-col gap-(--space-12)"
          onSubmit={(event) => {
            event.preventDefault()
            if (postalCodeDigits(postalCode).length !== 8) {
              setPostalCodeError('Informe um CEP com 8 dígitos')
              return
            }
            if (!busy) onSubmitPostalCode?.(postalCodeDigits(postalCode))
          }}
        >
          <TextField
            id="location-postal-code"
            label="CEP"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="00000-000"
            value={postalCode}
            error={postalCodeError}
            onChange={(event) => {
              setPostalCode(formatPostalCode(event.target.value))
              setPostalCodeError(undefined)
            }}
          />
          <ErrorText error={error} />
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? 'Buscando…' : 'Buscar CEP'}
          </Button>
        </form>

        {postalCodeMatch && (
          <div aria-live="polite" className="flex flex-col gap-(--space-8)">
            <p className="type-body text-(--text-body)">
              Encontramos: <strong className="text-(--text-strong)">{postalCodeMatch}</strong>
            </p>
            <Button size="lg" variant="secondary" className="w-full" onClick={onUsePostalCodeMatch}>
              Usar este local
            </Button>
          </div>
        )}
        <Back onStep={onStep} />
      </div>
    )
  }

  // step === 'search'
  return (
    <div className="flex flex-col gap-(--space-16)">
      <form
        noValidate
        className="flex flex-col gap-(--space-12)"
        onSubmit={(event) => {
          event.preventDefault()
          if (text.trim().length < 3) {
            setTextError('Digite pelo menos 3 letras')
            return
          }
          if (!busy) onSubmitSearch?.(text.trim())
        }}
      >
        <TextField
          id="location-search"
          label="Endereço, bairro ou cidade"
          autoComplete="off"
          placeholder="Ex.: Centro, Garça"
          value={text}
          error={textError}
          // A busca só roda no envio: o provedor público proíbe autocomplete.
          helper="Toque em Buscar para ver os resultados."
          onChange={(event) => {
            setText(event.target.value)
            setTextError(undefined)
          }}
        />
        <ErrorText error={error} />
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? 'Buscando…' : 'Buscar'}
        </Button>
      </form>

      {results && (
        <div aria-live="polite">
          {results.length === 0 ? (
            <p className="type-body text-(--text-muted)">
              Nada encontrado. Tente o nome da cidade ou o CEP.
            </p>
          ) : (
            <ul aria-label="Resultados" className="flex flex-col gap-(--space-4)">
              {results.map((place) => (
                <Option
                  key={`${place.latitude},${place.longitude},${place.label}`}
                  icon={<MapPin className="size-5" />}
                  label={place.label}
                  onClick={() => onPickResult?.(place)}
                />
              ))}
            </ul>
          )}
        </div>
      )}
      <Back onStep={onStep} />
    </div>
  )
}
