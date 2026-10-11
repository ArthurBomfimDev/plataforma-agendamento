import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'

import type { ThemeToggleProps } from './types'
import { cn } from 'cn'
import { useResolvedTheme } from '@hooks/use-theme'
import { useThemeStore } from '@lib/zustand/theme'

/**
 * Liga e desliga o tema escuro. TODO(figma): não há wireframe do controle; é um botão de ícone
 * com alvo de toque de 44px, nos tokens do design system.
 *
 * Enquanto ninguém escolhe, o tema segue o sistema operacional. O primeiro toque grava a escolha
 * explícita (o oposto do que está na tela), e ela passa a valer mesmo se o sistema trocar.
 *
 * O ícone mostra o tema atual; o estado vai para o leitor de tela pelo `aria-pressed`.
 */
export const ThemeToggle = (props: ThemeToggleProps) => {
  const { className } = props

  const setTheme = useThemeStore((state) => state.setTheme)
  const isDark = useResolvedTheme() === 'dark'

  return (
    <MotionConfig reducedMotion="user">
      <button
        type="button"
        aria-label="Tema escuro"
        aria-pressed={isDark}
        title={isDark ? 'Usar tema claro' : 'Usar tema escuro'}
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className={cn(
          'relative flex size-(--size-touch-min) shrink-0 items-center justify-center overflow-hidden rounded-(--radius-full) text-(--text-muted) transition-colors hover:bg-(--bg-surface-raised) hover:text-(--text-strong) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)',
          className,
        )}
      >
        {/* O ícone que sai gira e afunda; o que entra sobe girando. */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={isDark ? 'moon' : 'sun'}
            initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex"
          >
            {isDark ? (
              <Moon aria-hidden className="size-5" strokeWidth={2} />
            ) : (
              <Sun aria-hidden className="size-5" strokeWidth={2} />
            )}
          </motion.span>
        </AnimatePresence>
      </button>
    </MotionConfig>
  )
}
