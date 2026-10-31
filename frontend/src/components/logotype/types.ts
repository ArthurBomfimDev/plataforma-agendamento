export type LogotypeProps = {
  /**
   * Variante do Figma (`tema`). `light` = letreiro azul-marinho, para superfície clara;
   * `dark` = letreiro branco, para superfície escura; `auto` = segue o tema do app. Padrão: `light`.
   */
  tone?: 'light' | 'dark' | 'auto'
  /** Vazio quando o logotipo está dentro de um controle que já tem nome acessível. */
  alt?: string
  /** Defina só a altura: a largura segue a proporção 2,99:1 do arquivo. */
  className?: string
}
