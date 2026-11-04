import { ErrorState, LoadingState } from '@components/screen-state'
import { useState } from 'react'

import { Button } from '@components/button'
import { ImageUploader } from '@components/image-uploader'
import { LeaveBusiness } from '@components/leave-business'
import { PANEL_CARD, PanelPage } from '@components/panel-page'
import type { ProfileScreenProps, ProfileValues } from './types'
import { TextAreaField } from '@components/text-area-field'
import { TextField } from '@components/text-field'
import { notify } from '@components/toaster/notify'

/** Limites do domínio (`Professional`): bio 1000, especialidade 100, registro 40 caracteres. */
export const PROFILE_LIMITS = { specialty: 100, bio: 1000, registration: 40 } as const

const TITLE = 'Meu perfil'

/**
 * Painel — Meu perfil, do profissional com conta (ADR-031): a própria especialidade, apresentação e foto, que aparecem
 * na página pública do estabelecimento. O nome e a situação (ativo) são do dono. Em Saúde, o registro profissional é
 * opcional e também aparece na página pública. Quem controla estes dados é o próprio profissional.
 */
export const ProfileScreen = (props: ProfileScreenProps) => {
  const { data, businessName, showRegistration, onSave, onUploadPhoto, onRemovePhoto, onLeave } =
    props
  const subtitle = `${businessName} · o que aparece na sua página pública`

  if (data.status === 'loading') {
    return (
      <PanelPage title={TITLE} subtitle={subtitle}>
        <LoadingState label="Carregando seu perfil…" />
      </PanelPage>
    )
  }

  if (data.status === 'error') {
    return (
      <PanelPage title={TITLE} subtitle={subtitle}>
        <ErrorState message={data.message} onRetry={data.onRetry} />
      </PanelPage>
    )
  }

  const { profile } = data

  return (
    <PanelPage title={TITLE} subtitle={subtitle}>
      <ProfileForm
        // Salvar devolve o perfil novo; recomeçar o formulário dele evita mostrar o que foi digitado antes.
        key={`${profile.specialty}|${profile.bio}|${profile.registration}`}
        profile={profile}
        showRegistration={showRegistration}
        onSave={onSave}
      />

      <section aria-labelledby="profile-photo" className={PANEL_CARD}>
        <h2 id="profile-photo" className="type-label text-(--text-strong)">
          Foto
        </h2>
        <ImageUploader
          id="my-profile-photo"
          label={profile.displayName}
          note="Aparece na página pública. Sem foto, aparecem as suas iniciais."
          removeOf="do seu perfil"
          shape="card"
          current={profile.photo}
          fallback={
            <span className="type-caption flex size-full items-center justify-center text-(--text-muted)">
              sem foto
            </span>
          }
          onUpload={async (file, onProgress) => (await onUploadPhoto?.(file, onProgress)) ?? null}
          onRemove={onRemovePhoto}
        />
      </section>

      {onLeave && <LeaveBusiness businessName={businessName} onLeave={onLeave} />}
    </PanelPage>
  )
}

const ProfileForm = (props: {
  profile: NonNullable<Extract<ProfileScreenProps['data'], { status: 'ready' }>['profile']>
  showRegistration: boolean
  onSave: ProfileScreenProps['onSave']
}) => {
  const { profile, showRegistration, onSave } = props
  const [values, setValues] = useState<ProfileValues>({
    specialty: profile.specialty ?? '',
    bio: profile.bio ?? '',
    registration: profile.registration ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()

  const set = (patch: Partial<ProfileValues>) => setValues((current) => ({ ...current, ...patch }))

  return (
    <form
      noValidate
      aria-label="Dados do perfil"
      className={PANEL_CARD}
      onSubmit={async (event) => {
        event.preventDefault()
        if (saving) return
        setSaving(true)
        setError(undefined)
        const failure = await onSave?.(values)
        setSaving(false)
        if (failure) setError(failure)
        else notify.success('Perfil atualizado.')
      }}
    >
      <p className="type-caption text-(--text-muted)">
        O seu nome ({profile.displayName}) e se você está ativo são definidos pelo estabelecimento.
      </p>
      <TextField
        id="my-profile-specialty"
        label="Especialidade (opcional)"
        autoComplete="off"
        maxLength={PROFILE_LIMITS.specialty}
        value={values.specialty}
        onChange={(event) => set({ specialty: event.target.value })}
      />
      <TextAreaField
        id="my-profile-bio"
        label="Apresentação (opcional)"
        maxLength={PROFILE_LIMITS.bio}
        value={values.bio}
        onChange={(event) => set({ bio: event.target.value })}
      />
      {showRegistration && (
        <TextField
          id="my-profile-registration"
          label="Registro profissional (opcional)"
          helper="Ex.: CRP 06/123456. Aparece na sua página pública."
          autoComplete="off"
          maxLength={PROFILE_LIMITS.registration}
          value={values.registration}
          onChange={(event) => set({ registration: event.target.value })}
        />
      )}
      <p className="type-caption text-(--text-muted)">
        Não escreva dados de saúde de pessoas: a apresentação é pública.
      </p>
      {error && (
        <p role="alert" className="type-label text-(--status-rejected-fg)">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full md:w-auto md:self-start" disabled={saving}>
        {saving ? 'Salvando…' : 'Salvar'}
      </Button>
    </form>
  )
}
