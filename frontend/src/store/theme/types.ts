/** `system` segue o sistema operacional; `light` e `dark` são escolha explícita de quem usa. */
export type Theme = 'light' | 'dark' | 'system'

export type ResolvedTheme = Exclude<Theme, 'system'>

export type ThemeState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}
