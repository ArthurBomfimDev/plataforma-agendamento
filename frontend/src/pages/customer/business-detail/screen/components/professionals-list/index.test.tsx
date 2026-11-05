import { describe, expect, it } from 'vitest'

import { ProfessionalsList } from '.'
import { renderToString } from 'react-dom/server'

const render = (professionals: Parameters<typeof ProfessionalsList>[0]['professionals']) =>
  renderToString(
    <ProfessionalsList professionals={professionals} onOpen={() => undefined} />,
  ).replaceAll('<!-- -->', '')

describe('ProfessionalsList', () => {
  it('carregando: avisa que está carregando a equipe', () => {
    expect(render(undefined)).toContain('Carregando a equipe')
  })

  it('vazio: diz que ainda não há profissionais', () => {
    expect(render([])).toContain('ainda não tem profissionais')
  })

  it('sucesso: iniciais sem foto, especialidade, nota quando existe e o botão de ver o perfil', () => {
    const html = render([
      { id: 'p1', name: 'Marcos Lima', specialty: 'Barbeiro', photo: null },
      { id: 'p2', name: 'Paula Ramos', rating: 4.6, photo: null },
    ])

    expect(html).toContain('Marcos Lima')
    expect(html).toContain('ML')
    expect(html).toContain('Barbeiro')
    expect(html).toContain('aria-label="Ver perfil de Marcos Lima"')
    expect(html).toContain('Nota 4,6')
    expect(html.match(/Ver perfil/g)).toHaveLength(2 + 2) // rótulo + texto do botão de cada um
  })
})
