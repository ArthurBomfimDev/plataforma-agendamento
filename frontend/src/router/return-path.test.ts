import {
  NAVIGATION_PATHS,
  ROUTES,
  returnPathFor,
  safeRedirect,
  signInPath,
  signUpPath,
} from './paths'
import { describe, expect, it } from 'vitest'

describe('volta à tela de origem depois de entrar', () => {
  it('guarda a tela e a busca em que a pessoa estava', () => {
    expect(returnPathFor('/search', '?term=barbeiro&radius=5')).toBe(
      '/search?term=barbeiro&radius=5',
    )
    expect(returnPathFor('/businesses/abc/services/s1/availability', '?professional=p1')).toBe(
      '/businesses/abc/services/s1/availability?professional=p1',
    )
    expect(returnPathFor('/appointments')).toBe('/appointments')
  })

  it('não guarda a Home nem as telas de entrada, para não voltar para onde já se está', () => {
    for (const path of [ROUTES.home, ROUTES.signIn, ROUTES.signUp, ROUTES.checkEmail]) {
      expect(returnPathFor(path)).toBeUndefined()
    }
  })

  it('o que "Entrar" e "Criar conta" escrevem na URL passa pela validação de caminho interno', () => {
    const back = returnPathFor('/search', '?term=unha')

    expect(signInPath(back)).toBe('/sign-in?redirect=%2Fsearch%3Fterm%3Dunha')
    expect(signUpPath(back)).toBe('/sign-up?redirect=%2Fsearch%3Fterm%3Dunha')
    expect(safeRedirect(new URL(`http://x${signInPath(back)}`).searchParams.get('redirect'))).toBe(
      '/search?term=unha',
    )
    // Sem retorno, a URL fica limpa.
    expect(signInPath(undefined)).toBe('/sign-in')
  })

  it('"Perfil" na navegação inferior abre Minha conta; sem sessão, o guard leva a "Entrar" e volta', () => {
    expect(NAVIGATION_PATHS.profile).toBe(ROUTES.account)
    expect(signInPath(ROUTES.account)).toBe('/sign-in?redirect=%2Faccount')
  })
})
