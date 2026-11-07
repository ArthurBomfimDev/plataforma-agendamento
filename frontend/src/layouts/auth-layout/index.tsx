import { MotionConfig, motion } from 'framer-motion'
import { fadeUp, stagger } from '@pages/auth/sign-in/screen/consts'

import type { AuthLayoutProps } from './types'
import { BrandStage } from './components/brand-stage'
import { HeroPanel } from '@pages/auth/sign-in/screen/components/hero-panel'
import { Logotype } from '@components/logotype'
import type { ReactNode } from 'react'
import { ThemeToggle } from '@components/theme-toggle'

/**
 * Casca das telas de conta (Figma, A01 e A03): painel do formulário e palco de marca. No desktop o
 * formulário fica à esquerda; abaixo de 1180px o palco vira faixa no topo. O formulário vem antes no
 * DOM de propósito, para nada do palco ficar na frente dele na ordem de tabulação.
 *
 * Por enquanto só Entrar usa. Criar conta, Recuperar senha e Confirmação de e-mail seguem no
 * `AuthShell` até a próxima fatia.
 */
export const AuthLayout = (props: AuthLayoutProps) => {
  const { title, description, footnote, children } = props

  return (
    // Quem pediu menos movimento no sistema vê tudo aparecer sem deslocamento.
    <MotionConfig reducedMotion="user">
      <main className="flex min-h-dvh flex-col-reverse bg-(--brand-ink) md:bg-(--bg-surface) auth:h-dvh auth:flex-row auth:overflow-hidden">
        <motion.div
          variants={stagger(0.05)}
          initial="hidden"
          animate="show"
          className="relative z-10 -mt-9.5 flex flex-1 flex-col gap-(--space-16) rounded-t-(--radius-xl) bg-(--bg-surface) p-(--space-24) pb-[calc(var(--space-24)+env(safe-area-inset-bottom))] md:mt-0 md:items-center md:rounded-none md:py-(--space-40) auth:h-full auth:w-[min(660px,46%)] auth:flex-none auth:items-stretch auth:justify-between auth:overflow-y-auto auth:px-(--space-64)"
        >
          <motion.div
            variants={fadeUp}
            className="flex w-full max-w-115 shrink-0 items-center justify-between gap-(--space-16) md:justify-end auth:max-w-none auth:justify-between"
          >
            <div className="md:hidden auth:block">
              <Logotype tone="auto" className="h-11.75" />
            </div>
            <ThemeToggle />
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="flex w-full max-w-115 shrink-0 flex-col gap-(--space-16) auth:max-w-98 auth:gap-4.5"
          >
            <div className="flex flex-col gap-(--space-8)">
              <h1 className="type-title text-(--text-strong) md:text-(length:--size-display)! md:leading-(--line-height-display)!">
                {title}
              </h1>
              {description && <p className="type-body text-(--text-muted)">{description}</p>}
            </div>
            {children}
          </motion.div>

          {footnote && (
            <motion.p
              variants={fadeUp}
              className="type-caption w-full max-w-115 shrink-0 text-center text-(--text-muted) auth:max-w-98 auth:text-left"
            >
              {footnote}
            </motion.p>
          )}
        </motion.div>

        <BrandStage />
      </main>
    </MotionConfig>
  )
}

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
          <Logotype tone="auto" className="h-11.75" alt="" />
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
