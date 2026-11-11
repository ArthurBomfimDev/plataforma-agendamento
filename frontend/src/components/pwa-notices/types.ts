export type PwaNoticesViewProps = {
  /** O aparelho está sem rede. */
  offline: boolean
  /** Há versão nova do app esperando autorização. */
  updateAvailable: boolean
  /** Como oferecer a instalação, ou `null` para não oferecer. */
  installPrompt: 'promptable' | 'ios-manual' | null
  onUpdate: () => void
  onDismissUpdate: () => void
  onInstall: () => void
  onDismissInstall: () => void
}
