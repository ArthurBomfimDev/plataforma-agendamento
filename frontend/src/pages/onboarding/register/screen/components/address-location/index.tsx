import {
  APPROXIMATE_WARNING,
  LOCATION_NOT_FOUND,
  type LocationCheck,
  PRECISION_LABELS,
  isApproximate,
  mapLink,
} from './consts'

import { Button } from '@components/button'
import type { GeoPlaceResponse } from '@api/models'
import { RadioOptionGroup } from '@components/radio-option-group'
import { useState } from 'react'

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
 * ponto que coloca o estabelecimento na busca por distância. Sem mapa embutido: a CSP do site não permite, e o link abre
 * em outra aba.
 */
export const AddressLocation = (props: AddressLocationProps) => {
  const { check, busy, error, onConfirm, onRetry, onEdit } = props
  const [selected, setSelected] = useState('0')

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
  const place = places[Number(selected)] ?? places[0]!

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
