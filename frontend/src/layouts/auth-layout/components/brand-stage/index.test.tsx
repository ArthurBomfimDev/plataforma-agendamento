// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { blur, click, focus, mount, stubMatchMedia, unmountAll } from '@utils/test-dom'

import { AUTO_ADVANCE_MS } from './consts'
import { BrandStage } from '.'
import { act } from 'react'

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

const stage = () => {
  const { container } = mount(<BrandStage />)
  const tabs = [...container.querySelectorAll<HTMLElement>('[role="tab"]')]

  return {
    container,
    tabs,
    list: container.querySelector<HTMLElement>('[role="tablist"]')!,
    selected: () => tabs.find((tab) => tab.getAttribute('aria-selected') === 'true')?.textContent,
    progress: () => container.querySelector('[data-progress]'),
  }
}

const wait = (ms = AUTO_ADVANCE_MS) => act(() => vi.advanceTimersByTime(ms))

const pointer = (element: HTMLElement, type: 'pointerover' | 'pointerout') =>
  act(() => {
    element.dispatchEvent(new MouseEvent(type, { bubbles: true }))
  })

beforeEach(() => {
  vi.useFakeTimers()
  stubMatchMedia()
})

afterEach(() => {
  unmountAll()
  vi.useRealTimers()
})

describe('BrandStage', () => {
  it('as pílulas são uma tablist acessível e o desenho da agenda fica fora dela', () => {
    const { container, tabs, selected } = stage()

    expect(container.querySelector('[role="tablist"]')?.getAttribute('aria-label')).toBeTruthy()
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      'Barbearia',
      'Studio de unhas',
      'Fisioterapia',
    ])
    expect(selected()).toBe('Barbearia')
    expect(
      container.querySelector('[data-vertical]')?.closest('[aria-hidden="true"]'),
    ).not.toBeNull()
  })

  it('o resumo do painel acompanha a pílula e não entra na tabulação', () => {
    const { container, tabs } = stage()

    click(tabs[2]!)

    const panel = container.querySelector<HTMLElement>('[role="tabpanel"]:not([hidden])')!
    expect(panel.textContent).toBe('Clínica Movimento · 3 horários livres hoje')
    expect(panel.tabIndex).toBe(-1)
  })

  it('avança sozinho a cada 5,2 s, em ciclo', () => {
    const { selected } = stage()

    wait(AUTO_ADVANCE_MS - 1)
    expect(selected()).toBe('Barbearia')

    wait(1)
    expect(selected()).toBe('Studio de unhas')

    wait()
    expect(selected()).toBe('Fisioterapia')

    wait()
    expect(selected()).toBe('Barbearia')
  })

  it('o clique troca e o carrossel segue a partir dali, com a contagem recomeçada', () => {
    const { tabs, selected } = stage()

    wait(AUTO_ADVANCE_MS - 1)
    click(tabs[2]!)
    expect(selected()).toBe('Fisioterapia')

    wait(AUTO_ADVANCE_MS - 1)
    expect(selected()).toBe('Fisioterapia')

    wait(1)
    expect(selected()).toBe('Barbearia')
  })

  it('pausa com o foco e volta quando o foco sai', () => {
    const { tabs, selected } = stage()

    focus(tabs[0]!)
    wait(AUTO_ADVANCE_MS * 2)
    expect(selected()).toBe('Barbearia')

    blur(tabs[0]!)
    wait()
    expect(selected()).toBe('Studio de unhas')
  })

  it('pausa com o ponteiro sobre as pílulas e volta quando ele sai', () => {
    const { list, selected } = stage()

    pointer(list, 'pointerover')
    wait(AUTO_ADVANCE_MS * 2)
    expect(selected()).toBe('Barbearia')

    pointer(list, 'pointerout')
    wait()
    expect(selected()).toBe('Studio de unhas')
  })

  it('a barra de progresso aparece enquanto gira e some na pausa', () => {
    const { list, progress } = stage()

    expect(progress()).not.toBeNull()

    pointer(list, 'pointerover')
    expect(progress()).toBeNull()

    pointer(list, 'pointerout')
    expect(progress()).not.toBeNull()
  })

  it('o ponteiro sobre a trilha não pausa', () => {
    const { container, selected } = stage()

    pointer(container.querySelector<HTMLElement>('[data-vertical]')!, 'pointerover')
    wait()

    expect(selected()).toBe('Studio de unhas')
  })

  it('sob prefers-reduced-motion não avança sozinho, mas o clique continua trocando', () => {
    stubMatchMedia(REDUCED_MOTION)
    const { tabs, selected, progress } = stage()

    wait(AUTO_ADVANCE_MS * 3)
    expect(selected()).toBe('Barbearia')
    expect(progress()).toBeNull()

    click(tabs[1]!)
    expect(selected()).toBe('Studio de unhas')
  })
})
