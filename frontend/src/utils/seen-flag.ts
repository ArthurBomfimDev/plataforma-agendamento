// localStorage com try/catch: modo privado e armazenamento bloqueado não podem quebrar o painel.

/** O aviso com esta chave já foi visto neste navegador? Sem armazenamento, responde `false`. */
export const wasSeen = (key: string) => {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

/** Marca o aviso como visto. Sem armazenamento, ele só volta no próximo acesso. */
export const markSeen = (key: string) => {
  try {
    localStorage.setItem(key, '1')
  } catch {
    // sem armazenamento: nada a fazer
  }
}
