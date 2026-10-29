import { Check, ChevronRight, LogOut, Store, User } from 'lucide-react'
import { ErrorState, LoadingState } from '@components/screen-state'

import { Button } from '@components/button'
import type { ChooseContextScreenProps } from './types'
import { cn } from 'cn'

const CUSTOMER = 'customer'

/**
 * Conta e troca de contexto (Onda 7A; decisão de 22/09, §2.0, modelo iFood): a mesma conta entra
 * como consumidor ou no painel de um estabelecimento. É também a escolha depois de entrar, para
 * quem tem mais de um estabelecimento, e o destino de "Perfil" e de "Mais" no celular.
 */
export const ChooseContextScreen = (props: ChooseContextScreenProps) => {
  const { status, items, fromPanel, fromCustomerScreen, switching, onChoose, onSignOut } = props

  const businesses = items.filter(({ id }) => id !== CUSTOMER)
  const hasCustomer = items.some(({ id }) => id === CUSTOMER)
  const notice =
    fromPanel && businesses.length === 0
      ? 'Esta conta não tem um estabelecimento. O painel é só para quem tem.'
      : fromPanel
        ? 'Escolha o estabelecimento para abrir o painel.'
        : fromCustomerScreen && hasCustomer
          ? 'Para agendar e ver seus agendamentos, troque para consumidor.'
          : fromCustomerScreen
            ? 'Esta conta não tem perfil de consumidor. Para agendar, entre com uma conta de consumidor.'
            : null

  return (
    <main className="min-h-dvh bg-(--bg-page) px-(--space-16) pt-[calc(var(--space-24)+env(safe-area-inset-top))] pb-[calc(var(--space-24)+env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-120 flex-col gap-(--space-16)">
        <div className="flex flex-col gap-(--space-4)">
          <h1 className="type-heading text-(--text-strong)">Sua conta</h1>
          {props.fullName && <p className="type-body text-(--text-muted)">{props.fullName}</p>}
        </div>

        {notice && (
          <p
            role="status"
            className="type-label rounded-md border border-l-3 border-(--border-focus) bg-(--action-soft) px-(--space-12) py-(--space-8) text-(--text-body)"
          >
            {notice}
          </p>
        )}

        {status === 'loading' && <LoadingState />}
        {status === 'error' && (
          <ErrorState message={props.errorMessage ?? ''} onRetry={props.onRetry} />
        )}

        {/* Com um contexto só não há o que escolher (7CF): a tela fica com o nome e o "Sair". */}
        {status === 'ready' && items.length > 1 && (
          <section aria-labelledby="choose-context-title" className="flex flex-col gap-(--space-8)">
            <h2 id="choose-context-title" className="type-label text-(--text-muted)">
              Entrar como
            </h2>
            <ul className="flex flex-col gap-(--space-8)">
              {items.map((item) => {
                const Icon = item.id === CUSTOMER ? User : Store
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      disabled={switching}
                      aria-current={item.current ? 'true' : undefined}
                      onClick={() => onChoose(item.id)}
                      className={cn(
                        'type-body flex min-h-(--size-touch-min) w-full items-center gap-(--space-12) rounded-md border bg-(--bg-surface) px-(--space-16) py-(--space-12) text-left text-(--text-strong) hover:bg-(--bg-surface-raised) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus) disabled:opacity-60',
                        item.current
                          ? 'border-2 border-(--border-focus)'
                          : 'border-(--border-subtle)',
                      )}
                    >
                      <Icon aria-hidden="true" className="size-5 shrink-0 text-(--text-link)" />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {item.current ? (
                        <>
                          <Check
                            aria-hidden="true"
                            className="size-5 shrink-0 text-(--text-link)"
                          />
                          <span className="sr-only"> (atual)</span>
                        </>
                      ) : (
                        <ChevronRight
                          aria-hidden="true"
                          className="size-5 shrink-0 text-(--text-muted)"
                        />
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        <Button variant="secondary" className="self-start" onClick={onSignOut}>
          <LogOut aria-hidden="true" className="size-4" />
          Sair
        </Button>
      </div>
    </main>
  )
}
