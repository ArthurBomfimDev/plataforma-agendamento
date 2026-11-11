/**
 * Lê o payload de um JWT SEM validar a assinatura. Serve só para a interface decidir o que mostrar (por exemplo, a
 * área de Admin): quem protege de verdade é o servidor, que confere o token em toda rota. Nunca use isto para autorizar.
 */
export const readJwtPayload = (token: string): Record<string, unknown> | null => {
  const part = token.split('.')[1]
  if (!part) return null
  try {
    const base64 = part
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(part.length / 4) * 4, '=')
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes))
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null
  } catch {
    return null
  }
}

/** A claim `platform` do token do backend (`PlatformClaims.Role`) vale `admin` para o Admin da plataforma. */
export const hasPlatformAdminRole = (token: string | null | undefined) =>
  token ? readJwtPayload(token)?.platform === 'admin' : false
