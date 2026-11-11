/** O texto do aviso, sem espaços nas pontas; vazio quando a variável não existe ou só tem espaço. */
export const demoBannerText = (value: string | undefined): string => (value ?? '').trim()
