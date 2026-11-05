import { Button } from '@components/button'
import { Checkbox } from '@components/checkbox'
import { LockIcon } from '@assets/icons'
import { useState } from 'react'

export type SensitiveConsentProps = {
  /** O texto vigente, de `GET /api/consents/versions`. */
  text:
    | { status: 'loading' }
    | { status: 'error'; message: string; onRetry: () => void }
    | { status: 'ready'; value: string }
  busy: boolean
  /** Erro ao gravar ou ao reenviar, em português. */
  error?: string
  /** Grava o consentimento e reenvia o pedido. */
  onAccept: () => void
}

/**
 * Consentimento para agendar em Saúde (LGPD, Art. 11): específico, destacado e bloqueante. A caixa nasce desmarcada, e sem
 * ela o pedido não anda. Texto em rascunho: `docs/legal/consentimento-agendamento-saude.md`.
 */
export const SensitiveConsent = ({ text, busy, error, onAccept }: SensitiveConsentProps) => {
  const [accepted, setAccepted] = useState(false)
  const [missing, setMissing] = useState(false)

  return (
    <section
      aria-labelledby="sensitive-consent-title"
      className="flex flex-col gap-(--space-12) rounded-lg border-2 border-(--marker-sensitive-fg) bg-(--marker-sensitive-bg) p-(--space-16)"
    >
      <h2
        id="sensitive-consent-title"
        className="type-label flex items-center gap-(--space-8) text-(--marker-sensitive-fg)"
      >
        <LockIcon aria-hidden="true" className="size-4 shrink-0" />
        Antes de agendar em saúde, precisamos do seu consentimento
      </h2>

      {text.status === 'loading' && (
        <p role="status" className="type-body text-(--text-muted)">
          Carregando o texto…
        </p>
      )}
      {text.status === 'error' && (
        <div role="alert" className="flex flex-col items-start gap-(--space-8)">
          <p className="type-body text-(--text-body)">{text.message}</p>
          <Button variant="secondary" onClick={text.onRetry}>
            Tentar de novo
          </Button>
        </div>
      )}
      {text.status === 'ready' && (
        <>
          <p className="type-body text-(--text-body)">{text.value}</p>
          <Checkbox
            label="Li e dou o meu consentimento"
            checked={accepted}
            onCheckedChange={(checked) => {
              setAccepted(checked === true)
              if (checked) setMissing(false)
            }}
          />
          {missing && (
            <p role="alert" className="type-label text-(--status-rejected-fg)">
              Marque a caixa para continuar.
            </p>
          )}
          {error && (
            <p role="alert" className="type-label text-(--status-rejected-fg)">
              {error}
            </p>
          )}
          <Button
            size="lg"
            className="w-full"
            disabled={busy}
            onClick={() => {
              setMissing(!accepted)
              if (accepted) onAccept()
            }}
          >
            {busy ? 'Enviando…' : 'Dar consentimento e continuar'}
          </Button>
        </>
      )}
    </section>
  )
}
