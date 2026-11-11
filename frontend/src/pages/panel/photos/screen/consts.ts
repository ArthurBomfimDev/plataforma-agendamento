import type { PhotoProfessional } from './types'

/** Cartão da tela (Figma 19): um pouco mais folgado que o `PANEL_CARD` das outras telas de gestão. */
export const PHOTOS_CARD =
  'flex flex-col gap-3.5 rounded-(--radius-md) border border-(--border-subtle) bg-(--bg-surface) px-5 py-4.5'

/** Título pequeno do cartão ("IMAGENS DO ESTABELECIMENTO"): legenda em caixa alta, com espaçamento entre letras. */
export const PHOTOS_OVERLINE =
  'type-caption font-medium tracking-[0.8px] text-(--text-muted) uppercase'

export const PHOTOS_SUBTITLE = (businessName: string) =>
  `${businessName} · as imagens aparecem na busca e na página pública`

/** Onde a foto do profissional aparece. O perfil de quem está ativo é sempre público (ADR-031). */
export const professionalNote = (professional: PhotoProfessional) =>
  professional.photo ? 'Aparece na página pública' : 'Sem foto — aparece com as iniciais'
