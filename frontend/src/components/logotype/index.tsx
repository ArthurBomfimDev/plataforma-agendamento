import type { LogotypeProps } from './types'
import { cn } from 'cn'
import logotypeDark from '../../global/images/vagoo-logotipo-escuro.png'
import logotypeLight from '../../global/images/vagoo-logotipo-claro.png'

/**
 * Logotipo do Figma (component set "Logotipo"). O PNG é o 2× exportado de lá, 280×94.
 *
 * Proporção 2,99:1 — não distorcer. Sem o slogan: abaixo de 200px de largura ele não é legível.
 */
export const Logotype = (props: LogotypeProps) => {
  const { tone = 'light', alt = 'vagoo', className } = props

  return (
    <img
      src={tone === 'dark' ? logotypeDark : logotypeLight}
      alt={alt}
      width={280}
      height={94}
      className={cn('h-10 w-auto', className)}
    />
  )
}
