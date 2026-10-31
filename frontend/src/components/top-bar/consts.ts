/** Texto da referência da busca na barra e na Home: sempre visível, sempre clicável para trocar. */
export const locationReference = (label: string | null) =>
  label ? `Perto de: ${label}` : 'Escolher localização'
