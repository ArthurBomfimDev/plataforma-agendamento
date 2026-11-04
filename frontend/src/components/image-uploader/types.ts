import type { ImageSet } from '@api/models'
import type { ReactNode } from 'react'

/** `idle`: nada em andamento. `uploading`: enviando, com progresso. `done`: acabou de enviar. */
export type UploadStatus = 'idle' | 'uploading' | 'done'

/**
 * Formatos da moldura (Figma 19): `square` é o logotipo, `cover` a capa (cortada no centro) e `card` a foto de um
 * profissional, com o nome embaixo da moldura.
 */
export type UploadShape = 'square' | 'cover' | 'card'

/** O que deu errado, em três linhas: o título, o que aconteceu e, se houver, o que fazer (Figma 19b). */
export type UploadProblem = {
  title: string
  message: string
  hint?: string
}

export type ImageUploaderProps = {
  /** Prefixo dos ids (rótulo, ajuda, progresso). */
  id: string
  /** O que é a imagem: "Logotipo · quadrado", "Capa · 3:1, cortada no centro" ou o nome do profissional. */
  label: string
  /** Segunda linha do rótulo, só no `card` (a especialidade). */
  description?: string
  /** Complemento da linha de formatos aceitos ("no celular aparece só a faixa central"). */
  helpExtra?: string
  /** No `card`, a linha embaixo do botão (onde a foto aparece). Nos demais, a linha de formatos aceitos. */
  note?: string
  /** Imagem atual, vinda da API. Nula: mostra o `fallback`. */
  current: ImageSet | null
  /** Padrão visual sem imagem (ilustração, "sem foto"). */
  fallback: ReactNode
  /** Formato da moldura. */
  shape?: UploadShape
  /**
   * Envia o arquivo e devolve a imagem nova. A tela liga isto à rota certa — por exemplo
   * `managementService.uploadBusinessImage('logo', file, onProgress)`.
   */
  onUpload: (file: File, onProgress: (fraction: number) => void) => Promise<ImageSet | null>
  /** Remove a imagem. Ausente: sem botão de remover. */
  onRemove?: () => Promise<void>
  /** Na confirmação de remover: "do logotipo", "da capa", "de Marina Souza". */
  removeOf?: string
  disabled?: boolean
}

export type ImageUploaderViewProps = {
  id: string
  label: string
  description?: string
  helpExtra?: string
  note?: string
  shape: UploadShape
  /** O que mostrar agora: a pré-visualização local, a imagem atual ou o padrão. */
  preview: ReactNode
  hasImage: boolean
  status: UploadStatus
  /** De 0 a 1, enquanto envia. */
  progress: number
  /** Nome do arquivo que está subindo. */
  fileName?: string
  problem?: UploadProblem
  canRemove: boolean
  disabled?: boolean
  onChoose?: () => void
  onRemove?: () => void
}
