import { Button } from '@components/button'
import { SpinnerIcon } from '@assets/icons'

/**
 * Estados de tela inteira enquanto o dado vem da API. Não existe wireframe no Figma; o texto e o
 * layout seguem a 404 (`pages/not-found`).
 */

export const LoadingScreen = ({ label = 'Carregando…' }: { label?: string }) => (
  <main
    aria-busy="true"
    className="flex min-h-dvh items-start justify-center bg-(--bg-page) p-(--space-16) pt-[calc(var(--space-40)+env(safe-area-inset-top))]"
  >
    <p role="status" className="type-body flex items-center gap-(--space-8) text-(--text-muted)">
      <SpinnerIcon aria-hidden="true" className="size-5 animate-spin motion-reduce:animate-none" />
      {label}
    </p>
  </main>
)

/** Carregando dentro de uma tela que já tem moldura e `<main>` (painel). */
export const LoadingState = ({ label = 'Carregando…' }: { label?: string }) => (
  <p
    role="status"
    aria-busy="true"
    className="type-body flex items-center gap-(--space-8) text-(--text-muted)"
  >
    <SpinnerIcon aria-hidden="true" className="size-5 animate-spin motion-reduce:animate-none" />
    {label}
  </p>
)

/** Erro dentro de uma tela que já tem moldura e `<main>` (painel), com "Tentar de novo". */
export const ErrorState = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="flex flex-col items-start gap-(--space-8)">
    <p role="alert" className="type-body text-(--text-muted)">
      {message}
    </p>
    {onRetry && (
      <Button variant="secondary" onClick={onRetry}>
        Tentar de novo
      </Button>
    )}
  </div>
)

export const ErrorScreen = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <main className="flex min-h-dvh flex-col items-start gap-(--space-8) bg-(--bg-page) p-(--space-16) pt-[calc(var(--space-16)+env(safe-area-inset-top))]">
    <h1 className="type-heading text-(--text-strong)">Não foi possível carregar</h1>
    <p role="alert" className="type-body text-(--text-muted)">
      {message}
    </p>
    {onRetry && (
      <Button variant="secondary" onClick={onRetry}>
        Tentar de novo
      </Button>
    )}
  </main>
)
