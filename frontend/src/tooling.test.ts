import { expect, it } from 'vitest'

/**
 * Teste de fumaça do ferramental: prova que o Vitest roda sob o Bun.
 * Sai quando existir o primeiro teste de verdade.
 */
it('executa o Vitest', () => {
  expect(1 + 1).toBe(2)
})
