import { MotionConfig, motion } from 'framer-motion'
import { PAGE_TRANSITION, PAGE_VARIANTS } from './consts'

import type { PageTransitionProps } from './types'

/**
 * Entrada da tela ao trocar de seção. Só entra, não há animação de saída: a tela antiga some na hora, a nova
 * aparece em ~180 ms. Assim nunca há duas telas montadas ao mesmo tempo e a troca não espera animação.
 * Com "reduzir movimento" no sistema, o deslocamento some e fica só o fade.
 */
export const PageTransition = ({ transitionKey, children }: PageTransitionProps) => (
  <MotionConfig reducedMotion="user" transition={PAGE_TRANSITION}>
    <motion.div key={transitionKey} variants={PAGE_VARIANTS} initial="hidden" animate="visible">
      {children}
    </motion.div>
  </MotionConfig>
)
