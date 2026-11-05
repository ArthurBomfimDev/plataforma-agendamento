import { Button } from '@components/button'
import { Logotype } from '@components/logotype'
import type { MobileTopBarProps } from './types'
import { ThemeToggle } from '@components/theme-toggle'

/**
 * Barra superior do celular e do tablet (até 1024px; daí em diante vale a `TopBar`). Existe para que o tema, a
 * entrada e a saída estejam em toda tela pública, e não só na tela de login: logotipo, alternar tema e, sem sessão,
 * "Entrar" e "Criar conta"; com sessão, o menu da conta. Todo controle tem 44px de alvo de toque.
 */
export const MobileTopBar = (props: MobileTopBarProps) => {
  const { signedIn, onHome, onSignIn, onSignUp, accountMenu } = props

  return (
    <header className="border-b border-(--border-subtle) bg-(--bg-surface) pt-[env(safe-area-inset-top)] lg:hidden">
      <div className="mx-auto flex max-w-3xl items-center gap-(--space-8) px-(--space-16) py-(--space-8)">
        <button
          type="button"
          aria-label="vagoo — página inicial"
          onClick={onHome}
          className="flex min-h-(--size-touch-min) shrink-0 items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)"
        >
          <Logotype tone="auto" alt="" />
        </button>
        <div className="flex-1" />
        <ThemeToggle />
        {signedIn ? (
          accountMenu
        ) : (
          <>
            <Button
              variant="ghost"
              className="min-w-(--size-touch-min) shrink-0"
              onClick={onSignIn}
            >
              Entrar
            </Button>
            <Button className="shrink-0" onClick={onSignUp}>
              Criar conta
            </Button>
          </>
        )}
      </div>
    </header>
  )
}
