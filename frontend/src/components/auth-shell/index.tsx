import { HeroPanel } from '@features/sign-in/components/hero-panel'
import { Logotype } from '@components/logotype'
import type { ReactNode } from 'react'
import { ThemeToggle } from '@components/theme-toggle'

/**
 * Moldura das telas de conta (confirmar e-mail, redefinir senha…): o mesmo painel e a mesma coluna
 * de Entrar e Criar conta, sem barra superior, com o próprio seletor de tema.
 */
export const AuthShell = ({ title, children }: { title: string; children: ReactNode }) => (
  <main className="min-h-dvh bg-(--bg-surface) lg:flex">
    <HeroPanel />

    <div className="relative px-(--space-16) pt-(--space-24) pb-[calc(var(--space-16)+env(safe-area-inset-bottom))] lg:flex lg:min-w-0 lg:flex-1 lg:items-center lg:justify-center lg:p-(--space-40)">
      <ThemeToggle className="absolute top-(--space-16) right-(--space-16) lg:top-(--space-24) lg:right-(--space-24)" />

      <div className="mx-auto flex w-full max-w-md flex-col gap-(--space-16) lg:max-w-95.25">
        <div className="hidden self-start lg:block">
          <Logotype className="h-11.75 dark:hidden" alt="" />
          <Logotype tone="dark" className="hidden h-11.75 dark:block" alt="" />
        </div>

        <h1 className="type-title text-(--text-strong) lg:text-(length:--size-display)! lg:leading-(--line-height-display)!">
          {title}
        </h1>

        {children}
      </div>
    </div>
  </main>
)

/** Link de texto com alvo de toque de 44px: 20px de linha + 12px acima e abaixo. */
export const AUTH_LINK_CLASSES =
  'type-label -my-(--space-12) py-(--space-12) text-(--text-link) hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)'
