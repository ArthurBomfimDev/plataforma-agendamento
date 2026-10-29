import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { Ban, Hourglass } from 'lucide-react'
import { useState } from 'react'

import { ErrorState, LoadingState } from '@components/screen-state'
import { ConfirmDialog } from '@components/confirm-dialog'
import { ICON_BUTTON } from '@features/business-agenda/consts'
import { PANEL_CONTENT_BOTTOM_PADDING } from '@components/panel-bottom-navigation/consts'
import type { PendingRequest, PendingRequestsScreenProps } from './types'
import { RequestCard } from './components/request-card'
import { CARD_MOTION, byDeadline } from './consts'
import { cn } from 'cn'
import { toast } from '@lib/toast'
import { useNow } from '@hooks/use-now'

const NOTICE =
  'type-caption flex items-center gap-(--space-8) rounded-md border border-l-3 border-(--status-pending-fg) bg-(--status-pending-bg) py-(--space-8) pl-(--space-12) text-(--status-pending-fg)'

/**
 * Tela 10 · Painel — Pedidos pendentes (Figma: 10, desktop; P03, 390px). Vive dentro do
 * `PanelLayout`: aqui só o conteúdo, ao lado da navegação lateral ou acima da inferior.
 *
 * O que expira primeiro vem primeiro. TODO(figma): o desktop (10) lista do mais novo para o mais
 * antigo e o celular (P03), do mais urgente; ficou a ordem do celular nos dois.
 *
 * Os pedidos vêm da API pela rota (`panel-requests-route`); aceitar e recusar respondem de verdade.
 */
export const PendingRequestsScreen = (props: PendingRequestsScreenProps) => {
  const { data, expirationHours, autoConfirm, onAccept, onReject, onAutoConfirmSettings } = props

  const now = useNow()
  const [rejecting, setRejecting] = useState<PendingRequest | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const requests = data.status === 'ready' ? data.requests : []
  const sorted = requests.toSorted(byDeadline)
  const subtitle =
    data.status === 'ready' ? `${requests.length} aguardando sua resposta` : 'Pedidos pendentes'
  const autoConfirmLabel = `Confirmação automática: ${autoConfirm ? 'ligada' : 'desligada'}`

  const respond = async (request: PendingRequest, answer: typeof onAccept, message: string) => {
    setBusyId(request.id)
    try {
      if (await answer?.(request.id)) toast.success(message)
    } finally {
      setBusyId(null)
    }
  }

  const accept = (request: PendingRequest) =>
    void respond(
      request,
      onAccept,
      `Pedido de ${request.customerName} aceito. O horário está confirmado.`,
    )

  const reject = () => {
    if (!rejecting) return
    void respond(rejecting, onReject, 'Pedido recusado. O horário voltou a ficar livre.')
    setRejecting(null)
  }

  return (
    // Quem pediu menos movimento no sistema vê o card sair sem deslizar.
    <MotionConfig reducedMotion="user">
      {/* Celular e tablet (P03) */}
      <header className="sticky top-0 z-10 border-b border-(--border-subtle) bg-(--bg-surface) pt-[calc(var(--space-16)+env(safe-area-inset-top))] pb-(--space-12) lg:hidden">
        <div className="flex flex-col gap-(--space-12) px-(--space-16) md:mx-auto md:max-w-160">
          <div className="flex items-center gap-(--space-12)">
            <div className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
              <h1 className="type-heading text-(--text-strong)">Pedidos pendentes</h1>
              <p className="type-caption text-(--text-muted)">{subtitle}</p>
            </div>
            <button
              type="button"
              aria-label={autoConfirmLabel}
              onClick={onAutoConfirmSettings}
              className={ICON_BUTTON}
            >
              <Ban aria-hidden="true" className="size-6" />
            </button>
          </div>
          <p className={cn(NOTICE, 'pr-(--space-12)')}>
            <Hourglass aria-hidden="true" className="size-4 shrink-0" />
            Sem resposta em {expirationHours} h, o pedido expira e o horário volta a ficar livre.
          </p>
        </div>
      </header>

      <main
        className={cn(
          'flex flex-col gap-(--space-16) px-(--space-16) pt-(--space-12) md:mx-auto md:max-w-160 lg:mx-0 lg:max-w-none lg:px-(--space-24) lg:pt-(--space-24)',
          PANEL_CONTENT_BOTTOM_PADDING,
        )}
      >
        {/* Desktop (10) */}
        <div className="hidden items-center gap-(--space-16) lg:flex">
          <div className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
            <h1 className="type-heading text-(--text-strong)">Pedidos pendentes</h1>
            <p className="type-caption text-(--text-muted)">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onAutoConfirmSettings}
            className="type-caption flex min-h-(--size-touch-min) shrink-0 items-center gap-(--space-8) rounded-md border border-(--border-interactive) bg-(--bg-surface) px-(--space-12) py-(--space-8) text-(--text-body) hover:bg-(--bg-surface-raised) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)"
          >
            <Ban aria-hidden="true" className="size-4 shrink-0" />
            {autoConfirmLabel}
          </button>
        </div>
        <p className={cn(NOTICE, 'hidden pr-(--space-16) lg:flex')}>
          <Hourglass aria-hidden="true" className="size-4 shrink-0" />
          Pedido não respondido em {expirationHours} h expira automaticamente e o horário volta a
          ficar livre.
        </p>

        {data.status === 'loading' ? (
          <LoadingState label="Carregando os pedidos…" />
        ) : data.status === 'error' ? (
          <ErrorState message={data.message} onRetry={data.onRetry} />
        ) : sorted.length > 0 ? (
          <ul className="flex flex-col gap-(--space-12)">
            <AnimatePresence>
              {sorted.map((request, index) => (
                <motion.li
                  key={request.id}
                  layout
                  custom={index}
                  variants={CARD_MOTION}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ layout: { duration: 0.2 } }}
                >
                  <RequestCard
                    request={request}
                    now={now}
                    busy={busyId === request.id}
                    onAccept={accept}
                    onReject={setRejecting}
                  />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        ) : (
          <p role="status" className="type-body text-(--text-muted)">
            Nenhum pedido aguardando resposta.
          </p>
        )}
      </main>

      <ConfirmDialog
        open={rejecting !== null}
        onOpenChange={(open) => !open && setRejecting(null)}
        title="Recusar este pedido?"
        description={
          rejecting
            ? `${rejecting.serviceName} de ${rejecting.customerName}. O horário volta a ficar livre.`
            : ''
        }
        confirmLabel="Recusar pedido"
        dismissLabel="Manter pedido"
        onConfirm={reject}
      />
    </MotionConfig>
  )
}
