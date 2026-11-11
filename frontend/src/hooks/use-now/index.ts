import { useEffect, useState } from 'react'

/**
 * Hora atual, atualizada a cada `intervalMs`. Para contagens regressivas e tempos relativos
 * ("agora", "há 5 min"); não serve para medir tempo com precisão.
 */
export const useNow = (intervalMs = 30_000) => {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(timer)
  }, [intervalMs])

  return now
}
