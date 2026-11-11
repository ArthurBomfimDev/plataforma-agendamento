import { ChevronLeftIcon, ChevronRightIcon, ImageIcon } from '@assets/icons'
import { MAX_SHOWCASE_PHOTOS, moveOrder, positionLabel } from './consts'
import { PHOTOS_CARD, PHOTOS_OVERLINE } from '../../consts'
import { useState } from 'react'

import { Button } from '@components/button'
import { ImageUploader } from '@components/image-uploader'
import type { ShowcaseCardProps } from './types'
import { errorMessage } from '@api/base'

const FALLBACK =
  'flex size-full items-center justify-center bg-(--bg-surface-raised) text-(--text-muted)'

/**
 * Vitrine do estabelecimento: até 3 fotos na página pública, a primeira é a capa. Cada foto se troca ou se remove no
 * próprio lugar; "Mover" a leva uma casa para o lado (e quem chega ao primeiro lugar vira a capa). Há sempre um lugar
 * vazio a mais, até o limite de 3. As fotos entram na ordem: o servidor não deixa buraco.
 */
export const ShowcaseCard = (props: ShowcaseCardProps) => {
  const { photos, onUpload, onRemove, onReorder } = props
  const [moving, setMoving] = useState(false)
  const [problem, setProblem] = useState<string>()

  const move = async (index: number, delta: -1 | 1) => {
    const order = moveOrder(photos.length, index, delta)
    if (!order || moving) return
    setProblem(undefined)
    setMoving(true)
    try {
      await onReorder(order)
    } catch (caught) {
      setProblem(errorMessage(caught))
    } finally {
      setMoving(false)
    }
  }

  const slots = Math.min(photos.length + 1, MAX_SHOWCASE_PHOTOS)

  return (
    <section aria-labelledby="photos-showcase" className={PHOTOS_CARD}>
      <h2 id="photos-showcase" className={PHOTOS_OVERLINE}>
        Vitrine · até {MAX_SHOWCASE_PHOTOS} fotos
      </h2>
      <p className="type-caption text-(--text-muted)">
        A primeira foto é a capa: aparece na busca e no topo da página. No celular, quem vê desliza
        pelas fotos; no computador, as três aparecem lado a lado.
      </p>
      <ul className="grid gap-(--space-16) md:grid-cols-3">
        {Array.from({ length: slots }, (_, index) => {
          const photo = photos[index] ?? null
          return (
            // A foto é a identidade do lugar: ao reordenar, o envio em andamento acompanha a foto, não o número.
            <li
              key={photo?.medium ?? `empty-${index}`}
              className="flex min-w-0 flex-col gap-(--space-8)"
            >
              <ImageUploader
                id={`photo-showcase-${index}`}
                label={positionLabel(index)}
                removeOf={`da ${positionLabel(index).toLowerCase()}`}
                shape="cover"
                current={photo}
                fallback={
                  <span className={FALLBACK}>
                    <ImageIcon aria-hidden="true" className="size-8" />
                  </span>
                }
                onUpload={onUpload(index)}
                onRemove={photo ? onRemove(index) : undefined}
                disabled={moving}
              />
              {photo && photos.length > 1 && (
                <div className="flex gap-(--space-8)">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    disabled={moving || index === 0}
                    aria-label={`Mover a ${positionLabel(index).toLowerCase()} para a esquerda`}
                    onClick={() => void move(index, -1)}
                  >
                    <ChevronLeftIcon aria-hidden="true" className="size-4" />
                    Antes
                  </Button>
                  <Button
                    variant="secondary"
                    className="flex-1"
                    disabled={moving || index === photos.length - 1}
                    aria-label={`Mover a ${positionLabel(index).toLowerCase()} para a direita`}
                    onClick={() => void move(index, 1)}
                  >
                    Depois
                    <ChevronRightIcon aria-hidden="true" className="size-4" />
                  </Button>
                </div>
              )}
            </li>
          )
        })}
      </ul>
      {problem && (
        <p role="alert" className="type-label text-(--status-rejected-fg)">
          {problem}
        </p>
      )}
      <p className="type-caption text-(--text-muted)">
        Sem foto, a página usa a ilustração padrão da categoria — o estabelecimento continua
        aparecendo na busca. Removemos os dados de localização (EXIF) de toda imagem antes de
        publicar.
      </p>
    </section>
  )
}
