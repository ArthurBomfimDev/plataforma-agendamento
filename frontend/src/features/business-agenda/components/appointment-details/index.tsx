import { Clock, User, X } from 'lucide-react'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from '@components/ui/sheet'
import { entryEnd, expiryLabel, initials, minutesToExpire, toTime } from '../../consts'
import { useState } from 'react'

import type { AppointmentDetailsProps } from './types'
import { Avatar } from '@components/avatar'
import { Button } from '@components/button'
import { StatusChip } from '@components/status-chip'
import { cn } from 'cn'

/**
 * Detalhe de um agendamento do painel, num Sheet do shadcn (Base UI): lateral no desktop, de baixo
 * no celular. A lib dá foco preso, Esc e devolução do foco.
 *
 * Pedido pendente: confirmar ou recusar. Confirmado: concluir, marcar falta ou cancelar. Concluído e
 * falta: só leitura. Recusar, falta e cancelar pedem confirmação (`onAskConfirm`).
 *
 * TODO(figma): não há wireframe deste painel; segue os componentes e tokens existentes.
 */
export const AppointmentDetails = (props: AppointmentDetailsProps) => {
  const { selection, side, now, busy, onClose, onAction, onAskConfirm } = props

  // O Sheet anima a saída; enquanto isso, mantém o último conteúdo na tela.
  const [shown, setShown] = useState(selection)
  if (selection && selection !== shown) setShown(selection)
  if (!shown) return null

  const { entry, professional } = shown
  const remaining = minutesToExpire(entry, now)
  // Sem o fim (dado de teste), não esconde as ações: a API decide.
  const finished = !entry.endsAt || now >= entry.endsAt

  const row = (icon: React.ReactNode, label: string, value: React.ReactNode) => (
    <div className="flex items-center gap-(--space-12)">
      {icon}
      <div className="flex min-w-0 flex-col">
        <span className="type-caption text-(--text-muted)">{label}</span>
        <span className="type-body text-(--text-strong)">{value}</span>
      </div>
    </div>
  )

  return (
    <Sheet open={selection !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side={side}
        showCloseButton={false}
        className={cn(
          'gap-(--space-20) overflow-y-auto border-(--border-subtle) bg-(--bg-surface) p-(--space-24) text-(--text-body)',
          side === 'bottom'
            ? 'max-h-[85dvh] rounded-t-lg pb-[calc(var(--space-24)+env(safe-area-inset-bottom))]'
            : 'w-full sm:max-w-md',
        )}
      >
        <div className="flex items-start gap-(--space-12)">
          <div className="flex min-w-0 flex-1 flex-col gap-(--space-8)">
            <StatusChip status={entry.status} className="self-start" />
            <SheetTitle className="type-heading text-(--text-strong)">
              {entry.serviceName}
            </SheetTitle>
            <SheetDescription className="type-body tabular text-(--text-muted)">
              {entry.start} — {toTime(entryEnd(entry))} · {entry.durationMinutes} min
            </SheetDescription>
          </div>
          <SheetClose
            aria-label="Fechar"
            className="flex size-(--size-touch-min) shrink-0 items-center justify-center rounded-md text-(--text-muted) hover:bg-(--bg-surface-raised) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)"
          >
            <X aria-hidden="true" className="size-5" />
          </SheetClose>
        </div>

        <div className="flex flex-col gap-(--space-16) rounded-md border border-(--border-subtle) p-(--space-16)">
          {row(
            <Avatar alt="" initials={initials(entry.customerName)} size="sm" />,
            'Consumidor',
            entry.customerName,
          )}
          {row(
            <User aria-hidden="true" className="mx-(--space-4) size-6 text-(--text-muted)" />,
            'Profissional',
            professional.name,
          )}
        </div>

        {entry.status === 'pending' && (
          <>
            <p className="type-caption tabular flex items-center gap-(--space-4) text-(--status-pending-fg)">
              <Clock aria-hidden="true" className="size-4 shrink-0" />
              {remaining > 0
                ? `Aguardando sua resposta — expira em ${expiryLabel(remaining)}`
                : 'Prazo de confirmação encerrado'}
            </p>
            <div className="flex flex-col gap-(--space-8)">
              <Button
                size="lg"
                className="w-full"
                disabled={busy}
                onClick={() => onAction('confirm', entry.id)}
              >
                Confirmar agendamento
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                disabled={busy}
                onClick={() => onAskConfirm('reject', entry.id)}
              >
                Recusar pedido
              </Button>
            </div>
          </>
        )}

        {/* Remarcar não existe no backend (Onda 7A): cancela e o consumidor agenda de novo. */}
        {entry.status === 'confirmed' && (
          <div className="flex flex-col gap-(--space-8)">
            {finished ? (
              <>
                <Button
                  size="lg"
                  className="w-full"
                  disabled={busy}
                  onClick={() => onAction('complete', entry.id)}
                >
                  Concluir atendimento
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  disabled={busy}
                  onClick={() => onAskConfirm('noShow', entry.id)}
                >
                  Marcar falta
                </Button>
              </>
            ) : (
              <p className="type-caption text-(--text-muted)">
                Concluir e marcar falta ficam disponíveis depois das {toTime(entryEnd(entry))}.
              </p>
            )}
            <Button
              variant="ghost"
              className="w-full"
              disabled={busy}
              onClick={() => onAskConfirm('cancel', entry.id)}
            >
              Cancelar agendamento
            </Button>
            <p className="type-caption text-(--text-muted)">
              Para mudar o horário, cancele e peça ao consumidor que agende de novo.
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
