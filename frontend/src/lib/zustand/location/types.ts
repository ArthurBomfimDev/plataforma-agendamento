/** De onde veio a referência da busca. */
export type LocationSource = 'device' | 'postal-code' | 'search' | 'demo'

export type ChosenLocation = {
  /** O que a tela mostra: "Centro, Garça". */
  label: string
  /** Com 3 casas decimais (~110 m): é o que basta para a busca por raio, e é o que fica guardado. */
  latitude: number
  longitude: number
  source: LocationSource
  /**
   * Cidade e sigla da UF do ponto (Onda 7C): a distância "Cidade" da busca usa a cidade. Nulas quando o provedor
   * não soube, e ausentes numa localização guardada antes da 7C.
   */
  city?: string | null
  state?: string | null
  /** O navegador informou precisão ruim e a pessoa quis usar mesmo assim. */
  lowAccuracy?: boolean
}

export type LocationState = {
  location: ChosenLocation | null
  setLocation: (location: ChosenLocation) => void
  clearLocation: () => void
  /** O seletor é um só, montado na moldura; a barra e a Home só pedem para abrir. */
  pickerOpen: boolean
  openPicker: () => void
  closePicker: () => void
}
