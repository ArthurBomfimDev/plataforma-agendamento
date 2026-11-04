import type { Transition, Variants } from 'framer-motion'

/** Mesma duração e curva de `styles/motion.css`, para o framer-motion e o CSS se moverem juntos. */
export const PAGE_TRANSITION: Transition = { duration: 0.18, ease: [0.22, 1, 0.36, 1] }

/** Entrada discreta: some o corte seco, sem deslocar o layout (só `opacity` e `transform`). */
export const PAGE_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0 },
}
