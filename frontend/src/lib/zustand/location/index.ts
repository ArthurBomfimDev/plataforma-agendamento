import type { ChosenLocation, LocationState } from './types'
import { createJSONStorage, persist } from 'zustand/middleware'

import { create } from 'zustand'

const LOCATION_STORAGE_KEY = 'vagoo-location'

/** 3 casas decimais, ~110 m: o mesmo arredondamento do backend antes de falar com terceiros. */
export const roundCoordinate = (value: number) => Math.round(value * 1_000) / 1_000

/** A opção fixa para a banca: os dados de `scripts/seed-demo.ts` ficam em Garça-SP. */
export const DEMO_LOCATION: ChosenLocation = {
  label: 'Garça, SP',
  latitude: -22.213,
  longitude: -49.656,
  source: 'demo',
  city: 'Garça',
  state: 'SP',
}

/**
 * Referência da busca escolhida pela pessoa (Onda 6B). Fica no `localStorage` para a próxima visita; sem ele
 * (aba anônima, dado bloqueado), o `persist` só não guarda e a tela pede de novo.
 *
 * Guarda o ponto já arredondado, nunca o exato do aparelho.
 */
export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      location: null,
      setLocation: (location) =>
        set({
          location: {
            ...location,
            latitude: roundCoordinate(location.latitude),
            longitude: roundCoordinate(location.longitude),
          },
        }),
      clearLocation: () => set({ location: null }),
      pickerOpen: false,
      openPicker: () => set({ pickerOpen: true }),
      closePicker: () => set({ pickerOpen: false }),
    }),
    {
      name: LOCATION_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ location: state.location }),
    },
  ),
)
