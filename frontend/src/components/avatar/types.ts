export type AvatarProps = {
  /** Sem foto, mostra o ícone de pessoa sobre fundo neutro (variante "foto" do Figma). */
  src?: string
  alt: string
  /**
   * Variante "iniciais" do Figma: sem foto, mostra as letras sobre `action/soft`. Com `src`, vale
   * como fallback enquanto a imagem não carrega.
   */
  initials?: string
  /** `sm` = 32px (painel), `md` = 40px. Padrão: `md`. */
  size?: 'sm' | 'md'
  className?: string
}
