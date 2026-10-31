import { ErrorState, LoadingState } from '@components/screen-state'
import { ImageIcon, ShieldCheck, Store } from 'lucide-react'
import { PANEL_CARD, PANEL_NOTICE, PanelPage } from '@components/panel-page'

import { ImageUploader } from '@components/image-uploader'
import type { PhotosScreenProps } from './types'
import { initials } from '@features/business-agenda/consts'

const FALLBACK =
  'flex size-full items-center justify-center bg-(--bg-surface-raised) text-(--text-muted)'

/**
 * Painel — Fotos (Onda 7D): logotipo, capa e a foto de cada profissional, com o `ImageUploader` da
 * Onda 6D (escolher, pré-visualizar, enviar com progresso, remover). Só o dono (`RequireOwner`).
 *
 * A foto do profissional só vai para a vitrine com o perfil completo dele, que exige o consentimento
 * do próprio profissional (decisões de 22/09 §3). Sem isso, a foto fica guardada e só aparece aqui.
 */
export const PhotosScreen = (props: PhotosScreenProps) => {
  const {
    data,
    businessName,
    onUploadBusiness,
    onRemoveBusiness,
    onUploadProfessional,
    onRemoveProfessional,
  } = props

  return (
    <PanelPage title="Fotos" subtitle={businessName}>
      {data.status === 'loading' ? (
        <LoadingState label="Carregando as imagens…" />
      ) : data.status === 'error' ? (
        <ErrorState message={data.message} onRetry={data.onRetry} />
      ) : (
        <>
          <section aria-labelledby="photos-business" className={PANEL_CARD}>
            <h2 id="photos-business" className="type-label text-(--text-strong)">
              Estabelecimento
            </h2>
            <div className="flex flex-col gap-(--space-24) md:flex-row md:items-start">
              <div className="md:w-48 md:shrink-0">
                <ImageUploader
                  id="photo-logo"
                  label="Logotipo"
                  shape="square"
                  current={data.logo}
                  fallback={
                    <span className={FALLBACK}>
                      <Store aria-hidden="true" className="size-8" />
                    </span>
                  }
                  onUpload={onUploadBusiness('logo')}
                  onRemove={onRemoveBusiness('logo')}
                />
              </div>
              <div className="min-w-0 flex-1">
                <ImageUploader
                  id="photo-cover"
                  label="Capa"
                  shape="cover"
                  current={data.cover}
                  fallback={
                    <span className={FALLBACK}>
                      <ImageIcon aria-hidden="true" className="size-8" />
                    </span>
                  }
                  onUpload={onUploadBusiness('cover')}
                  onRemove={onRemoveBusiness('cover')}
                />
              </div>
            </div>
          </section>

          <section aria-labelledby="photos-team" className={PANEL_CARD}>
            <h2 id="photos-team" className="type-label text-(--text-strong)">
              Profissionais
            </h2>
            <p className={PANEL_NOTICE}>
              <ShieldCheck aria-hidden="true" className="mt-(--space-2) size-4 shrink-0" />A foto do
              profissional só aparece na vitrine com o perfil completo, que precisa do consentimento
              dele. Sem consentimento, fica guardada e só você vê.
            </p>
            {data.professionals.length === 0 ? (
              <p role="status" className="type-body text-(--text-muted)">
                Nenhum profissional ativo. Cadastre a equipe em Profissionais.
              </p>
            ) : (
              <ul className="grid gap-(--space-24) sm:grid-cols-2 xl:grid-cols-3">
                {data.professionals.map((professional) => (
                  <li key={professional.id} className="flex flex-col gap-(--space-8)">
                    <ImageUploader
                      id={`photo-professional-${professional.id}`}
                      label={professional.name}
                      shape="round"
                      current={professional.photo}
                      fallback={
                        <span className="type-heading flex size-full items-center justify-center bg-(--action-soft) text-(--text-link)">
                          {initials(professional.name)}
                        </span>
                      }
                      onUpload={onUploadProfessional(professional.id)}
                      onRemove={onRemoveProfessional(professional.id)}
                    />
                    <p className="type-caption text-(--text-muted)">
                      {professional.isPubliclyVisible
                        ? 'Aparece na vitrine.'
                        : 'Não aparece na vitrine: sem perfil completo (consentimento).'}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </PanelPage>
  )
}
