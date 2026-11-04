import { describe, expect, it } from 'vitest'
import { hasPlatformAdminRole, readJwtPayload } from '.'

// Um JWT real é base64url de bytes UTF-8 (não de Latin-1, que é o que `btoa` faria com a string crua).
const b64url = (value: object) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(value))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
const token = (payload: object) => `${b64url({ alg: 'HS256' })}.${b64url(payload)}.assinatura`

describe('readJwtPayload', () => {
  it('lê o payload em base64url, inclusive com acento', () => {
    expect(readJwtPayload(token({ sub: 'u1', name: 'José' }))).toEqual({ sub: 'u1', name: 'José' })
  })

  it('devolve nulo para token malformado, sem lançar', () => {
    expect(readJwtPayload('')).toBeNull()
    expect(readJwtPayload('abc')).toBeNull()
    expect(readJwtPayload('a.%%%.c')).toBeNull()
  })
})

describe('hasPlatformAdminRole', () => {
  it('é verdadeiro só com platform = admin', () => {
    expect(hasPlatformAdminRole(token({ sub: 'u1', platform: 'admin' }))).toBe(true)
    expect(hasPlatformAdminRole(token({ sub: 'u1', platform: 'outro' }))).toBe(false)
    expect(hasPlatformAdminRole(token({ sub: 'u1' }))).toBe(false)
    expect(hasPlatformAdminRole(null)).toBe(false)
    expect(hasPlatformAdminRole(undefined)).toBe(false)
  })
})
