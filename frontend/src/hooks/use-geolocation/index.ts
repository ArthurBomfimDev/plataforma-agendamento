import type {
  GeolocationFailure,
  GeolocationPosition,
  GeolocationState,
  UseGeolocation,
} from './types'
import { useCallback, useState } from 'react'

/** Códigos do `GeolocationPositionError` (1, 2, 3), sem depender da classe existir no ambiente. */
export const failureOf = (
  code: number,
): { state: GeolocationState; failure: GeolocationFailure | null } =>
  code === 1
    ? { state: 'denied', failure: null }
    : { state: 'failed', failure: code === 3 ? 'timeout' : 'unavailable' }

/** Precisão acima disto é "ruim": o resultado pode não estar perto de verdade, e a tela avisa. */
export const POOR_ACCURACY_METERS = 1_000

const OPTIONS: PositionOptions = {
  // Bairro basta para a busca por raio; alta precisão gasta bateria e demora mais.
  enableHighAccuracy: false,
  timeout: 10_000,
  maximumAge: 5 * 60_000,
}

/**
 * Posição do aparelho (regra 5 de empacotamento): nenhum componente chama `navigator.geolocation`.
 * No Capacitor, troca-se o corpo deste hook pelo plugin nativo, sem tocar em tela nenhuma.
 *
 * Nada é pedido ao montar: a permissão só é pedida quando a pessoa chama `request`.
 */
export const useGeolocation = (): UseGeolocation => {
  const [state, setState] = useState<GeolocationState>('idle')
  const [position, setPosition] = useState<GeolocationPosition | null>(null)
  const [failure, setFailure] = useState<GeolocationFailure | null>(null)

  const request = useCallback(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setState('failed')
      setFailure('unsupported')
      return
    }

    setState('prompting')
    setFailure(null)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPosition({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracyMeters: coords.accuracy,
        })
        setState('granted')
      },
      (error) => {
        const next = failureOf(error.code)
        setState(next.state)
        setFailure(next.failure)
      },
      OPTIONS,
    )
  }, [])

  const reset = useCallback(() => {
    setState('idle')
    setPosition(null)
    setFailure(null)
  }, [])

  return { state, position, failure, request, reset }
}
