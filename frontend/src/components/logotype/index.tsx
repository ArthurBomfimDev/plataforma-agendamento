import { LOGOTYPE_HEIGHT, LOGOTYPE_WIDTH } from './consts'

import type { LogotypeProps } from './types'
import { cn } from 'cn'
import logotypeDark from '../../assets/images/vagoo-logotipo-escuro.png'
import logotypeLight from '../../assets/images/vagoo-logotipo-claro.png'

/**
 * Logotipo do Figma (component set "Logotipo"). O PNG é o 2× exportado de lá, 280×94.
 *
 * Proporção 2,99:1 — não distorcer. Sem o slogan: abaixo de 200px de largura ele não é legível.
 */
export const Logotype = (props: LogotypeProps) => {
  const { tone = 'light', alt = 'vagoo', className } = props

  // O tema é uma classe no `<html>`: os dois arquivos vão para a página e o CSS mostra o certo, sem piscar.
  if (tone === 'auto') {
    return (
      <>
        <Logotype alt={alt} className={cn('dark:hidden', className)} />
        <Logotype tone="dark" alt={alt} className={cn('hidden dark:block', className)} />
      </>
    )
  }

  return (
    <img
      src={tone === 'dark' ? logotypeDark : logotypeLight}
      alt={alt}
      width={LOGOTYPE_WIDTH}
      height={LOGOTYPE_HEIGHT}
      className={cn('h-10 w-auto', className)}
    />
  )
}
