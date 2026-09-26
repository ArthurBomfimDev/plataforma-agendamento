import type { ComponentProps } from 'react'
import type { Button as UiButton } from '../ui/button'

/** A variante e o tamanho ficam fixos no Figma (primário, md); a tela não os escolhe. */
export type ButtonProps = Omit<ComponentProps<typeof UiButton>, 'variant' | 'size'>
