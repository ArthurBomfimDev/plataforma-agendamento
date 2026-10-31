/** "Ana Souza" → "AS"; "Ana" → "AN"; sem letras → "?". Ignora preposições comuns ("da", "de", "dos"…). */
export const initialsOf = (name: string) => {
  const words = name
    .trim()
    .split(/\s+/)
    .filter((word) => word && !/^(d[aeo]s?|e)$/i.test(word))
  const letters =
    words.length >= 2
      ? `${words[0]![0]}${words[words.length - 1]![0]}`
      : (words[0] ?? '').replace(/[^\p{L}]/gu, '').slice(0, 2)
  return letters.toLocaleUpperCase('pt-BR') || '?'
}
