import {
  APPROXIMATE_WARNING,
  LOCATION_NOT_FOUND,
  type LocationCheck,
  PRECISION_LABELS,
  isApproximate,
  mapLink,
} from './consts'
import {
  FAR_FROM_SEARCH_METERS,
  FAR_WARNING,
  MAP_HELP,
  distanceMeters,
} from '@components/pin-map/consts'
import { Suspense, lazy, useState } from 'react'

import { Button } from '@components/button'
import type { GeoPlaceResponse } from '@api/models'
import type { MapPoint } from '@components/pin-map/consts'
import { RadioOptionGroup } from '@components/radio-option-group'

// O Leaflet só baixa quando o dono chega a esta etapa.
const PinMap = lazy(() => import('@components/pin-map'))

export type AddressLocationProps = {
  check: Exclude<LocationCheck, { status: 'idle' }>
  busy: boolean
  /** Erro ao gravar a confirmação. */
  error?: string
  onConfirm: (place: GeoPlaceResponse) => void
  onRetry: () => void
  onEdit: () => void
}

/**
 * O dono confere o ponto que a busca achou antes de gravar (source `owner-confirmed`). Nada é confirmado sozinho: é esse
 * ponto que coloca o estabelecimento na busca por distância. O mapa deixa o dono arrastar o pino para a porta certa, que a
 * busca por texto nem sempre acha (cidade pequena); o ponto arrastado vale como exato (`Rooftop`).
 */
export const AddressLocation = (props: AddressLocationProps) => {
  const { check, busy, error, onConfirm, onRetry, onEdit } = props
  const [selected, setSelected] = useState('0')
  // Pino movido pelo dono, por resultado: trocar de resultado volta ao ponto que a busca deu.
  const [moved, setMoved] = useState<{ index: string; point: MapPoint } | null>(null)

  const editButton = (
    <Button variant="ghost" disabled={busy} onClick={onEdit}>
      Corrigir o endereço
    </Button>
  )

  if (check.status === 'loading') {
    return (
      <p role="status" className="type-body text-(--text-muted)">
        Procurando o endereço…
      </p>
    )
  }

  if (check.status === 'not-found') {
    return (
      <div className="flex flex-col gap-(--space-12)">
        <p role="alert" className="type-label text-(--status-rejected-fg)">
          {LOCATION_NOT_FOUND}
        </p>
        {editButton}
      </div>
    )
  }

  if (check.status === 'error') {
    return (
      <div className="flex flex-col gap-(--space-12)">
        <p role="alert" className="type-label text-(--status-rejected-fg)">
          {check.message}
        </p>
        <Button variant="secondary" onClick={onRetry}>
          Tentar de novo
        </Button>
        {editButton}
      </div>
    )
  }

  const { places } = check
  const found = places[Number(selected)] ?? places[0]!
  const point = moved?.index === selected ? moved.point : null
  // O que vai ser gravado: o ponto arrastado (exato, porque o dono o pôs), ou o que a busca achou.
  const place: GeoPlaceResponse = point
    ? { ...found, latitude: point.latitude, longitude: point.longitude, precision: 'Rooftop' }
    : found
  const farFromSearch = point !== null && distanceMeters(found, point) > FAR_FROM_SEARCH_METERS

  return (
    <div className="flex flex-col gap-(--space-12)">
      <p className="type-body text-(--text-muted)">
        Confira se é aqui. Este ponto define a distância que aparece na busca.
      </p>
      {isApproximate(place) && (
        <p role="status" className="type-label text-(--text-body)">
          {APPROXIMATE_WARNING}
        </p>
      )}
      <p className="type-label text-(--text-body)">{MAP_HELP}</p>
      <Suspense
        fallback={
          <p role="status" className="type-body text-(--text-muted)">
            Abrindo o mapa…
          </p>
        }
      >
        <PinMap
          // O mapa é refeito ao trocar de resultado: centra de novo no ponto novo.
          key={selected}
          latitude={place.latitude}
          longitude={place.longitude}
          onChange={(next) => setMoved({ index: selected, point: next })}
        />
      </Suspense>
      {farFromSearch && (
        <p role="status" className="type-label text-(--status-rejected-fg)">
          {FAR_WARNING}
        </p>
      )}
      <RadioOptionGroup
        aria-label="Localização encontrada"
        value={selected}
        options={places.map((item, index) => ({
          value: String(index),
          label: item.label,
          description: PRECISION_LABELS[item.precision],
        }))}
        onValueChange={setSelected}
      />
      <a
        href={mapLink(place)}
        target="_blank"
        rel="noopener noreferrer"
        className="type-label flex min-h-(--size-touch-min) items-center self-start text-(--text-link) underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)"
      >
        Ver no mapa
      </a>
      {error && (
        <p role="alert" className="type-label text-(--status-rejected-fg)">
          {error}
        </p>
      )}
      <Button size="lg" className="w-full" disabled={busy} onClick={() => onConfirm(place)}>
        {busy ? 'Confirmando…' : 'Confirmar esta localização'}
      </Button>
      {editButton}
    </div>
  )
}
