import { AnimatePresence, motion } from 'framer-motion'
import {
  DndContext,
  type DragEndEvent,
  type DragMoveEvent,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { PX_PER_MINUTE, SNAP_MINUTES, canPlace, initials, toMinutes, toTime } from '../../consts'
import type { AgendaProfessional } from '../../types'
import { useRef, useState } from 'react'

import { Avatar } from '@components/avatar'
import { CSS } from '@dnd-kit/utilities'
import type { AppointmentBlockProps, DayGridProps, Preview } from './types'
import { Plus } from 'lucide-react'
import { cn } from 'cn'
import { toast } from '@lib/toast'
import {
  BLOCK_BASE,
  blockGeometry,
  blockPadding,
  ENTRY_CLASSES,
  FIT_IN_PREVIEW_MINUTES,
  SNAP_PX,
  snapToQuarterHour,
  TWO_LINES_MIN_MINUTES,
} from './consts'

/**
 * Agendamento: abre o detalhe no clique. TODO: arrastar para remarcar volta quando o backend tiver
 * remarcação (Onda 7A: não existe); até lá nenhum bloco é arrastável.
 */
const AppointmentBlock = (props: AppointmentBlockProps) => {
  const { entry, preview, onOpen } = props

  const draggable = false
  const { listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: entry.id,
    disabled: !draggable,
  })
  const twoLines = entry.durationMinutes >= TWO_LINES_MIN_MINUTES
  const detail =
    entry.status === 'pending'
      ? `${entry.customerName} · pendente`
      : entry.status === 'confirmed'
        ? entry.customerName
        : `${entry.customerName} · ${entry.status === 'completed' ? 'concluído' : 'faltou'}`
  const start = isDragging && preview ? toTime(preview.start) : entry.start

  return (
    <button
      ref={setNodeRef}
      type="button"
      {...listeners}
      // O teclado não arrasta: Enter abre o detalhe, onde dá para remarcar (WCAG 2.5.7).
      aria-roledescription={draggable ? 'agendamento arrastável' : undefined}
      onClick={onOpen}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(
        BLOCK_BASE,
        blockPadding(entry.durationMinutes),
        ENTRY_CLASSES[entry.status],
        'transition-[background-color,border-color,color,box-shadow] duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)',
        draggable && 'cursor-grab touch-none',
        isDragging &&
          'relative z-20 cursor-grabbing shadow-(--elevation-card) ring-2 ring-(--border-focus)',
        isDragging && preview && !preview.valid && 'opacity-60 ring-(--border-error)',
      )}
    >
      <span>
        {start} {entry.serviceName}
      </span>
      {twoLines ? (
        <span className={cn(entry.status === 'confirmed' && 'opacity-75')}>{detail}</span>
      ) : (
        <span className="sr-only">{detail}</span>
      )}
    </button>
  )
}

type ColumnProps = {
  professional: AgendaProfessional
  axisStart: number
  axisEnd: number
  height: number
  hours: number[]
  dragging: boolean
  preview: Preview | null
  onOpen: (entryId: string) => void
  onFitIn: (time: string) => void
}

/** Coluna de um profissional: alvo de soltura e, no hover, prévia de encaixe. */
const Column = (props: ColumnProps) => {
  const { professional, axisStart, axisEnd, height, hours, dragging, preview } = props
  const { onOpen, onFitIn } = props

  const { setNodeRef, isOver } = useDroppable({ id: professional.id })
  const [hoverStart, setHoverStart] = useState<number | null>(null)

  const workStart = toMinutes(professional.workStart)
  const workEnd = toMinutes(professional.workEnd)
  const offHours = [
    [axisStart, workStart],
    [workEnd, axisEnd],
  ].filter(([start, end]) => end > start)

  // A prévia não recebe o mouse (`pointer-events-none`): o alvo continua sendo a coluna. Se a prévia
  // fosse clicável, o cursor sobre ela contaria como "saiu da coluna" e ela piscaria.
  const trackHover = (event: React.PointerEvent<HTMLElement>) => {
    if (dragging || event.target !== event.currentTarget) return setHoverStart(null)
    const offset = event.clientY - event.currentTarget.getBoundingClientRect().top
    const minute = axisStart + offset / PX_PER_MINUTE
    // Enquanto o cursor está dentro da prévia, ela fica parada. Sem isso, o tremor natural da mão
    // (1px para cima e para baixo) na divisa entre dois quartos de hora a faz pular de um para o outro.
    if (
      hoverStart !== null &&
      minute >= hoverStart &&
      minute < hoverStart + FIT_IN_PREVIEW_MINUTES
    ) {
      return
    }
    const slot = axisStart + Math.floor(offset / PX_PER_MINUTE / SNAP_MINUTES) * SNAP_MINUTES
    // Começa no quarto de hora do cursor; se ali não cabe, recua um passo e ainda o cobre.
    const start = [slot, slot - SNAP_MINUTES].find((candidate) =>
      canPlace(professional, candidate, FIT_IN_PREVIEW_MINUTES),
    )
    setHoverStart(start ?? null)
  }

  return (
    <section
      ref={setNodeRef}
      aria-label={professional.name}
      onPointerMove={trackHover}
      onPointerLeave={() => setHoverStart(null)}
      onClick={(event) => {
        // Atalho só de mouse; pelo teclado o caminho é "+ Marcação de balcão".
        if (hoverStart !== null && event.target === event.currentTarget) {
          onFitIn(toTime(hoverStart))
        }
      }}
      className={cn(
        'relative min-w-0 flex-1 rounded-sm transition-colors duration-200',
        isOver && dragging && 'bg-(--action-soft)',
        hoverStart !== null && 'cursor-pointer',
      )}
      style={{ height }}
    >
      {hours.slice(1).map((hour) => (
        <div
          key={hour}
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 h-px bg-(--border-subtle)"
          style={{ top: (hour - axisStart) * PX_PER_MINUTE }}
        />
      ))}

      {offHours.map(([start, end]) => (
        <div
          key={`off-hours-${start}`}
          className={cn(
            BLOCK_BASE,
            blockPadding(end - start),
            ENTRY_CLASSES.offHours,
            'pointer-events-none absolute inset-x-0',
          )}
          style={blockGeometry(start, end - start, axisStart)}
        >
          {toTime(start)} Fora do expediente
        </div>
      ))}

      {/* Onde o bloco arrastado vai cair. */}
      {preview?.professionalId === professional.id && (
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-x-0 rounded-sm border-2 border-dashed',
            preview.valid ? 'border-(--border-focus)' : 'border-(--border-error)',
          )}
          style={blockGeometry(preview.start, preview.durationMinutes, axisStart)}
        />
      )}

      {hoverStart !== null && (
        <div
          aria-hidden="true"
          className="type-caption tabular pointer-events-none absolute inset-x-0 flex items-center gap-(--space-4) rounded-sm border border-dashed border-(--agenda-free-border) bg-(--action-soft) px-(--space-8) text-(--text-link)"
          style={blockGeometry(hoverStart, FIT_IN_PREVIEW_MINUTES, axisStart)}
        >
          <Plus aria-hidden="true" className="size-4 shrink-0" />
          {toTime(hoverStart)} Encaixar
        </div>
      )}

      <ul>
        <AnimatePresence initial={false}>
          {professional.entries.map((entry) => {
            const start = toMinutes(entry.start)

            return (
              // Confirmar, recusar ou remarcar: o bloco some de um lugar e aparece no outro.
              <motion.li
                key={entry.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  'absolute inset-x-0',
                  entry.kind === 'block' && 'pointer-events-none',
                )}
                style={blockGeometry(start, entry.durationMinutes, axisStart)}
              >
                {entry.kind === 'appointment' ? (
                  <AppointmentBlock
                    entry={entry}
                    preview={preview}
                    onOpen={() => onOpen(entry.id)}
                  />
                ) : (
                  <div
                    className={cn(
                      BLOCK_BASE,
                      blockPadding(entry.durationMinutes),
                      ENTRY_CLASSES.block,
                    )}
                  >
                    {entry.start} {entry.label}
                  </div>
                )}
              </motion.li>
            )
          })}
        </AnimatePresence>
      </ul>
    </section>
  )
}

/**
 * Agenda do dia no desktop (tela 09): uma coluna por profissional, sobre o eixo de horas.
 * No celular ela vira a `DayList`, um profissional por vez.
 *
 * Interações: clicar no agendamento abre o detalhe; arrastar o confirmado (dnd-kit) remarca, de
 * 15 em 15 min e entre colunas; passar o mouse num horário vazio oferece o encaixe.
 */
export const DayGrid = (props: DayGridProps) => {
  const { professionals, nowMinutes, onOpen, onMove, onFitIn } = props

  const sensors = useSensors(
    // 6px de folga: um clique simples abre o detalhe em vez de começar a arrastar.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )
  const [activeId, setActiveId] = useState<string | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  // Soltar o bloco dispara um clique nele; esse clique não deve abrir o detalhe.
  const suppressClick = useRef(false)

  // O eixo cobre da primeira entrada à última saída, em horas cheias.
  const axisStart =
    Math.floor(Math.min(...professionals.map((p) => toMinutes(p.workStart))) / 60) * 60
  const axisEnd = Math.ceil(Math.max(...professionals.map((p) => toMinutes(p.workEnd))) / 60) * 60
  const hours = Array.from(
    { length: (axisEnd - axisStart) / 60 },
    (_, index) => axisStart + index * 60,
  )
  const height = (axisEnd - axisStart) * PX_PER_MINUTE

  const locate = (entryId: string) => {
    for (const professional of professionals) {
      const entry = professional.entries.find(({ id }) => id === entryId)
      if (entry) return { entry, professional }
    }
    return null
  }

  const computePreview = (event: DragMoveEvent | DragEndEvent): Preview | null => {
    const found = locate(String(event.active.id))
    if (!found) return null
    const target = professionals.find(({ id }) => id === event.over?.id) ?? found.professional
    const minutes = Math.round(event.delta.y / SNAP_PX) * SNAP_MINUTES
    const start = toMinutes(found.entry.start) + minutes
    const valid = canPlace(target, start, found.entry.durationMinutes, found.entry.id)
    return { professionalId: target.id, start, valid, durationMinutes: found.entry.durationMinutes }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const found = locate(String(event.active.id))
    const next = computePreview(event)
    setActiveId(null)
    setPreview(null)
    setTimeout(() => (suppressClick.current = false))
    if (!found || !next) return

    const unchanged =
      next.professionalId === found.professional.id && next.start === toMinutes(found.entry.start)
    if (unchanged) return
    if (!next.valid) {
      toast.error('Esse horário não está livre.')
      return
    }
    onMove({
      entryId: found.entry.id,
      professionalId: next.professionalId,
      start: toTime(next.start),
    })
  }

  const showNow = nowMinutes !== null && nowMinutes >= axisStart && nowMinutes <= axisEnd

  return (
    <div className="flex flex-col gap-(--space-8) rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-(--space-16)">
      <div aria-hidden="true" className="flex gap-(--space-12)">
        <div className="w-13 shrink-0" />
        {professionals.map((professional) => (
          <div
            key={professional.id}
            className="flex h-6 min-w-0 flex-1 items-center justify-center gap-(--space-8)"
          >
            <Avatar alt="" initials={initials(professional.name)} size="sm" />
            <p className="type-label truncate text-(--text-strong)">{professional.name}</p>
          </div>
        ))}
      </div>

      <DndContext
        sensors={sensors}
        modifiers={[snapToQuarterHour]}
        collisionDetection={pointerWithin}
        onDragStart={(event) => {
          setActiveId(String(event.active.id))
          suppressClick.current = true
        }}
        onDragMove={(event) => setPreview(computePreview(event))}
        onDragEnd={handleDragEnd}
        onDragCancel={() => {
          setActiveId(null)
          setPreview(null)
          setTimeout(() => (suppressClick.current = false))
        }}
      >
        <div className="relative flex gap-(--space-12)">
          <div aria-hidden="true" className="relative w-13 shrink-0" style={{ height }}>
            {hours.map((hour) => (
              <p
                key={hour}
                className="type-caption tabular absolute left-0 text-(--text-muted)"
                style={{ top: (hour - axisStart) * PX_PER_MINUTE + 2 }}
              >
                {toTime(hour)}
              </p>
            ))}
          </div>

          {professionals.map((professional) => (
            <Column
              key={professional.id}
              professional={professional}
              axisStart={axisStart}
              axisEnd={axisEnd}
              height={height}
              hours={hours}
              dragging={activeId !== null}
              preview={preview}
              onOpen={(entryId) => {
                if (suppressClick.current) return
                onOpen(entryId)
              }}
              onFitIn={(time) => onFitIn(professional.id, time)}
            />
          ))}

          {showNow && (
            <motion.div
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="pointer-events-none absolute right-0 left-13 z-10 flex items-center"
              style={{ top: (nowMinutes - axisStart) * PX_PER_MINUTE }}
            >
              <span className="-ml-1 size-2 rounded-(--radius-full) bg-(--action-primary)" />
              <span className="h-0.5 flex-1 bg-(--action-primary)" />
            </motion.div>
          )}
        </div>
      </DndContext>
    </div>
  )
}
