import { DEMO_LOCATION, useLocationStore } from '@lib/zustand/location'
import { POOR_ACCURACY_METERS, useGeolocation } from '@hooks/use-geolocation'
import { postalCodeLabel, postalCodeQueries } from './consts'
import { useEffect, useState } from 'react'

import type { ChosenLocation } from '@lib/zustand/location/types'
import { Dialog } from '@base-ui/react/dialog'
import type { GeoPlaceResponse } from '@lib/api/types'
import { LocationPickerPanel } from './panel'
import type { PickerStep } from './types'
import { X } from 'lucide-react'
import { errorMessage } from '@lib/api/errors'
import { geoApi } from '@lib/api/endpoints'

const TITLES: Record<PickerStep, string> = {
  menu: 'Onde você quer agendar?',
  'device-notice': 'Usar sua localização',
  'device-pending': 'Usar sua localização',
  'device-poor': 'Localização pouco precisa',
  'device-denied': 'Localização não permitida',
  'device-failed': 'Localização indisponível',
  'postal-code': 'Buscar por CEP',
  search: 'Endereço, bairro ou cidade',
}

/**
 * Seletor de localização (Onda 6B): um só, montado na moldura, aberto pela barra superior e pela Home. Três
 * caminhos — aparelho (com aviso antes da permissão), CEP e texto — e a opção de demonstração.
 *
 * Diálogo do Base UI: foco preso, Esc fecha e devolve o foco a quem abriu.
 */
export const LocationPicker = () => {
  const open = useLocationStore((state) => state.pickerOpen)
  const closePicker = useLocationStore((state) => state.closePicker)
  const current = useLocationStore((state) => state.location)
  const setLocation = useLocationStore((state) => state.setLocation)
  const device = useGeolocation()

  const [step, setStep] = useState<PickerStep>('menu')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [poor, setPoor] = useState<ChosenLocation | null>(null)
  const [postalCodeMatch, setPostalCodeMatch] = useState<ChosenLocation | null>(null)
  const [results, setResults] = useState<GeoPlaceResponse[] | null>(null)

  const goTo = (next: PickerStep) => {
    setStep(next)
    setError(undefined)
    setResults(null)
    setPostalCodeMatch(null)
  }

  const choose = (location: ChosenLocation) => {
    setLocation(location)
    closePicker()
  }

  // Cada abertura começa do menu.
  useEffect(() => {
    if (open) {
      goTo('menu')
      device.reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // A resposta do navegador decide o passo seguinte.
  useEffect(() => {
    if (!open) return
    if (device.state === 'denied') setStep('device-denied')
    if (device.state === 'failed') setStep('device-failed')
    if (device.state !== 'granted' || !device.position) return

    const { latitude, longitude, accuracyMeters } = device.position
    let cancelled = false

    void geoApi
      .reverse(latitude, longitude)
      // Sem rótulo do provedor, a busca ainda funciona com o ponto (em "Cidade", pelo maior raio).
      .catch(() => ({ label: 'Sua localização', city: null, state: null }))
      .then((place) => {
        if (cancelled) return
        const location: ChosenLocation = {
          label: place.label,
          latitude,
          longitude,
          source: 'device',
          city: place.city ?? null,
          state: place.state ?? null,
        }
        if (accuracyMeters > POOR_ACCURACY_METERS) {
          setPoor({ ...location, lowAccuracy: true })
          setStep('device-poor')
        } else {
          choose(location)
        }
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, device.state, device.position])

  const run = async (action: () => Promise<void>) => {
    setBusy(true)
    setError(undefined)
    try {
      await action()
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  const submitPostalCode = (postalCode: string) =>
    run(async () => {
      setPostalCodeMatch(null)
      const address = await geoApi.postalCode(postalCode)

      // O CEP não traz o ponto: procura do endereço mais preciso ao mais largo.
      for (const text of postalCodeQueries(address)) {
        const place = (await geoApi.search(text)).items[0]
        if (place) {
          setPostalCodeMatch({
            label: postalCodeLabel(address),
            latitude: place.latitude,
            longitude: place.longitude,
            source: 'postal-code',
            // A cidade do CEP é a dos Correios: mais confiável que a do ponto achado no mapa.
            city: address.city,
            state: address.state,
          })
          return
        }
      }

      setError('Achamos o CEP, mas não o ponto no mapa. Tente pelo nome da cidade.')
    })

  const submitSearch = (text: string) =>
    run(async () => {
      setResults((await geoApi.search(text)).items)
    })

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && closePicker()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-(--bg-scrim)/50" />
        <Dialog.Popup className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col gap-(--space-16) overflow-y-auto rounded-t-lg bg-(--bg-surface) p-(--space-16) pb-[calc(var(--space-16)+env(safe-area-inset-bottom))] text-(--text-body) shadow-(--elevation-card) outline-none md:inset-x-auto md:top-1/2 md:bottom-auto md:left-1/2 md:w-full md:max-w-md md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-lg md:p-(--space-24)">
          <div className="flex items-start justify-between gap-(--space-12)">
            <Dialog.Title className="type-heading text-(--text-strong)">
              {TITLES[step]}
            </Dialog.Title>
            <Dialog.Close
              aria-label="Fechar"
              className="-m-(--space-8) flex size-(--size-touch-min) shrink-0 items-center justify-center rounded-(--radius-full) text-(--text-muted) hover:text-(--text-strong) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)"
            >
              <X aria-hidden="true" className="size-5" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            Escolha a referência usada para buscar estabelecimentos perto.
          </Dialog.Description>

          <LocationPickerPanel
            step={step}
            current={current}
            busy={busy}
            error={error}
            accuracyMeters={poor ? device.position?.accuracyMeters : undefined}
            postalCodeMatch={postalCodeMatch?.label ?? null}
            results={results}
            onStep={goTo}
            onAskDevice={() => {
              setStep('device-pending')
              device.request()
            }}
            onUsePoorAnyway={() => poor && choose(poor)}
            onUseDemo={() => choose(DEMO_LOCATION)}
            onSubmitPostalCode={(postalCode) => void submitPostalCode(postalCode)}
            onUsePostalCodeMatch={() => postalCodeMatch && choose(postalCodeMatch)}
            onSubmitSearch={(text) => void submitSearch(text)}
            onPickResult={(place) =>
              choose({
                label: place.label,
                latitude: place.latitude,
                longitude: place.longitude,
                source: 'search',
                city: place.city ?? null,
                state: place.state ?? null,
              })
            }
          />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
