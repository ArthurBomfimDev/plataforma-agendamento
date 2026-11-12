import 'leaflet/dist/leaflet.css'
import './pin-map.css'

import {
  DEFAULT_ZOOM,
  MAX_ZOOM,
  NUDGE_LABELS,
  type NudgeDirection,
  TILE_ATTRIBUTION,
  TILE_URL,
  nudge,
} from './consts'
import L from 'leaflet'
import { useEffect, useRef } from 'react'
import type { PinMapProps } from './types'
import { Button } from '@components/button'

const ARROWS: ReadonlyArray<{ direction: NudgeDirection; arrow: string }> = [
  { direction: 'north', arrow: '↑' },
  { direction: 'west', arrow: '←' },
  { direction: 'east', arrow: '→' },
  { direction: 'south', arrow: '↓' },
]

/**
 * Mapa com um pino que o dono arrasta (ou toca) para corrigir o ponto que a busca achou. Pelo teclado e por leitor de tela,
 * quatro botões andam o pino 10 m: arrastar não tem equivalente de teclado no Leaflet. Carregado sob demanda (a tela
 * de endereço é a única que usa), porque o Leaflet pesa e quase ninguém passa por ela.
 *
 * Os ladrilhos vêm do OpenStreetMap; é a única origem externa de imagem do site (CSP `img-src`, ver `nginx.conf`).
 */
export default function PinMap({ latitude, longitude, onChange, className }: PinMapProps) {
  const container = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  // O mapa nasce uma vez; as mudanças de ponto seguintes só movem o pino.
  useEffect(() => {
    if (!container.current) return undefined

    const map = L.map(container.current, { zoomControl: true, attributionControl: true })
    map.attributionControl.setPrefix(false)
    map.setView([latitude, longitude], DEFAULT_ZOOM)

    L.tileLayer(TILE_URL, {
      maxZoom: MAX_ZOOM,
      attribution: TILE_ATTRIBUTION,
      // O site manda `Referrer-Policy: same-origin`; o servidor de ladrilhos exige saber a origem do pedido.
      referrerPolicy: 'origin',
    }).addTo(map)

    const marker = L.marker([latitude, longitude], {
      draggable: true,
      keyboard: true,
      title: 'Arraste para ajustar',
      icon: L.divIcon({
        className: 'pin-map__marker',
        html: '<span class="pin-map__dot"></span>',
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      }),
    }).addTo(map)

    marker.on('dragend', () => {
      const { lat, lng } = marker.getLatLng()
      onChangeRef.current({ latitude: lat, longitude: lng })
    })
    map.on('click', (event: L.LeafletMouseEvent) => {
      marker.setLatLng(event.latlng)
      onChangeRef.current({ latitude: event.latlng.lat, longitude: event.latlng.lng })
    })

    mapRef.current = map
    markerRef.current = marker

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
    // Só na montagem: o ponto inicial não recria o mapa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Ponto novo vindo de fora (outro resultado escolhido, botões de ajuste): move o pino e centra.
  useEffect(() => {
    const marker = markerRef.current
    const map = mapRef.current
    if (!marker || !map) return
    const current = marker.getLatLng()
    if (current.lat !== latitude || current.lng !== longitude) {
      marker.setLatLng([latitude, longitude])
      map.panTo([latitude, longitude])
    }
  }, [latitude, longitude])

  return (
    <div className={className}>
      <div
        ref={container}
        role="application"
        aria-label="Mapa para ajustar a localização"
        className="h-64 w-full overflow-hidden rounded-md border border-(--border-subtle)"
      />
      <div
        role="group"
        aria-label="Ajuste fino do pino"
        className="mt-(--space-8) flex flex-wrap gap-(--space-8)"
      >
        {ARROWS.map(({ direction, arrow }) => (
          <Button
            key={direction}
            variant="secondary"
            aria-label={NUDGE_LABELS[direction]}
            className="min-w-(--size-touch-min)"
            onClick={() => onChange(nudge({ latitude, longitude }, direction))}
          >
            <span aria-hidden="true">{arrow}</span>
          </Button>
        ))}
      </div>
    </div>
  )
}
