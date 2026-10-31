import { afterEach, describe, expect, it, vi } from 'vitest'
import { chooseEntry, forgetContexts, readLastContext, rememberContext } from './context'

import type { UserBusinessResponse } from '@api/models'

const duartina: UserBusinessResponse = { businessId: 'b1', name: 'Estúdio Duartina', role: 'Owner' }
const garca: UserBusinessResponse = { businessId: 'b2', name: 'Barbearia Garça', role: 'Owner' }

describe('chooseEntry', () => {
  it('só consumidor entra como consumidor', () => {
    expect(chooseEntry({ hasCustomerProfile: true, businesses: [] }, null)).toEqual({
      kind: 'customer',
    })
  })

  it('só estabelecimento vai direto para o painel, mesmo com "consumidor" lembrado', () => {
    const me = { hasCustomerProfile: false, businesses: [duartina] }

    expect(chooseEntry(me, null)).toEqual({ kind: 'business', business: duartina })
    expect(chooseEntry(me, 'customer')).toEqual({ kind: 'business', business: duartina })
  })

  it('dono que também é consumidor: o painel na primeira vez, depois o último usado', () => {
    const me = { hasCustomerProfile: true, businesses: [duartina] }

    expect(chooseEntry(me, null).kind).toBe('business')
    expect(chooseEntry(me, 'customer').kind).toBe('customer')
    expect(chooseEntry(me, 'b1').kind).toBe('business')
  })

  it('"Sou estabelecimento" vence o "consumidor" lembrado; vir de um agendamento vence o painel', () => {
    const me = { hasCustomerProfile: true, businesses: [duartina] }

    expect(chooseEntry(me, 'customer', 'business').kind).toBe('business')
    expect(chooseEntry(me, 'b1', 'customer').kind).toBe('customer')
  })

  it('vários estabelecimentos: o lembrado, ou a escolha', () => {
    const me = { hasCustomerProfile: false, businesses: [duartina, garca] }

    expect(chooseEntry(me, 'b2')).toEqual({ kind: 'business', business: garca })
    expect(chooseEntry(me, null)).toEqual({ kind: 'choose' })
    // Estabelecimento lembrado que a conta perdeu não vale.
    expect(chooseEntry(me, 'b-antigo')).toEqual({ kind: 'choose' })
  })
})

describe('contexto lembrado', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('lembra por conta e esquece ao sair', () => {
    const store = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
    })

    rememberContext('u1', 'b1')
    rememberContext('u2', null)
    expect(readLastContext('u1')).toBe('b1')
    expect(readLastContext('u2')).toBe('customer')

    forgetContexts()
    expect(readLastContext('u1')).toBeNull()
  })

  it('sem armazenamento (aba privada, bloqueado), não quebra: entra como primeira vez', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('SecurityError')
      },
      setItem: () => {
        throw new Error('SecurityError')
      },
      removeItem: () => {
        throw new Error('SecurityError')
      },
    })

    expect(() => rememberContext('u1', 'b1')).not.toThrow()
    expect(readLastContext('u1')).toBeNull()
    expect(() => forgetContexts()).not.toThrow()
  })
})
