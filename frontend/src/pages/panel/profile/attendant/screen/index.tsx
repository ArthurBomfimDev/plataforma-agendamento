import { ErrorState, LoadingState } from '@components/screen-state'
import { NameForm, PasswordForm } from '@pages/account/screen'

import type { AttendantProfileScreenProps } from './types'
import { Button } from '@components/button'
import { ConfirmDialog } from '@components/confirm-dialog'
import { LogoutIcon } from '@assets/icons'
import { PanelPage } from '@components/panel-page'
import { useState } from 'react'

/**
 * Meu perfil do atendente: nome, e-mail, senha e sair. O atendente não tem registro de profissional, então aqui não há
 * foto, página pública nem campo de profissional.
 */
export const AttendantProfileScreen = (props: AttendantProfileScreenProps) => {
  const { data, businessName, onSaveName, onChangePassword, onSignOut } = props
  const [confirmingSignOut, setConfirmingSignOut] = useState(false)

  return (
    <PanelPage title="Meu perfil" subtitle={businessName}>
      {data.status === 'loading' ? (
        <LoadingState label="Carregando a conta…" />
      ) : data.status === 'error' ? (
        <ErrorState message={data.message} onRetry={data.onRetry} />
      ) : (
        <>
          <NameForm fullName={data.fullName} email={data.email} onSave={onSaveName} />
          <PasswordForm onChange={onChangePassword} />
        </>
      )}

      <Button
        variant="ghost"
        size="lg"
        className="w-full"
        onClick={() => setConfirmingSignOut(true)}
      >
        <LogoutIcon aria-hidden="true" className="size-4" />
        Sair
      </Button>

      <ConfirmDialog
        open={confirmingSignOut}
        onOpenChange={setConfirmingSignOut}
        title="Sair da conta?"
        description="Você precisará entrar de novo para abrir o painel."
        confirmLabel="Sair"
        dismissLabel="Continuar na conta"
        onConfirm={onSignOut}
      />
    </PanelPage>
  )
}
