/**
 * `idle`: ninguém pediu ainda. `prompting`: esperando o navegador (e a pessoa). `granted`: posição na mão.
 * `denied`: a pessoa não permitiu. `failed`: permitiu, mas não deu (sem sinal, tempo esgotado, sem suporte).
 */
export type GeolocationState = 'idle' | 'prompting' | 'granted' | 'denied' | 'failed'

export type GeolocationFailure = 'timeout' | 'unavailable' | 'unsupported'

export type GeolocationPosition = {
  latitude: number
  longitude: number
  /** Raio de incerteza em metros, como o navegador informa. No desktop via wi-fi pode passar de quilômetros. */
  accuracyMeters: number
}

export type UseGeolocation = {
  state: GeolocationState
  position: GeolocationPosition | null
  failure: GeolocationFailure | null
  /** Pede a posição. Só chamar quando a pessoa tocou em "Usar minha localização" (decisões de 22/09 §5.5). */
  request: () => void
  reset: () => void
}
