import type { ComponentProps } from 'react'
import type { Switch as UiSwitch } from '@components/ui/switch'

/** Sempre com nome acessível: `aria-label` ou um `<label>` ligado ao interruptor. */
export type SwitchProps = Omit<ComponentProps<typeof UiSwitch>, 'size'>
