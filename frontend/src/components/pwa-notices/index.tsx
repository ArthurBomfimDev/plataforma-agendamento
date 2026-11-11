import { PwaNoticesView } from './view'
import { useOnlineStatus } from '@hooks/use-online-status'
import { usePwaInstall } from '@hooks/use-pwa-install'
import { usePwaUpdate } from '@hooks/use-pwa-update'
import { useState } from 'react'

/** A pessoa já disse "agora não" para instalar. Preferência só deste aparelho; sem armazenamento, pergunta de novo. */
export const INSTALL_DISMISSED_KEY = 'vagoo-install-dismissed'

const readDismissed = () => {
  try {
    return localStorage.getItem(INSTALL_DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

const rememberDismissed = () => {
  try {
    localStorage.setItem(INSTALL_DISMISSED_KEY, '1')
  } catch {
    // Navegação privativa ou armazenamento bloqueado: o aviso volta na próxima visita, e tudo bem.
  }
}

/** Avisos do app instalável: sem conexão, nova versão e instalar (ADR-035). Os hooks fazem o contato com o navegador. */
export const PwaNotices = () => {
  const online = useOnlineStatus()
  const update = usePwaUpdate()
  const install = usePwaInstall()
  const [installDismissed, setInstallDismissed] = useState(readDismissed)

  const dismissInstall = () => {
    rememberDismissed()
    setInstallDismissed(true)
  }

  const offer =
    install.status === 'promptable' || install.status === 'ios-manual' ? install.status : null

  return (
    <PwaNoticesView
      offline={!online}
      updateAvailable={update.updateAvailable}
      installPrompt={installDismissed ? null : offer}
      onUpdate={update.applyUpdate}
      onDismissUpdate={update.dismissUpdate}
      onInstall={() => {
        void install.install().then((outcome) => {
          if (outcome === 'dismissed') dismissInstall()
        })
      }}
      onDismissInstall={dismissInstall}
    />
  )
}
