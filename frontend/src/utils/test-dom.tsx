import { type Root, createRoot } from 'react-dom/client'
import { act, type ReactNode } from 'react'

/**
 * Apoio dos testes de interação. Use com `// @vitest-environment jsdom` no topo do arquivo: os outros
 * testes do projeto continuam em node, com `renderToString`.
 */
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const mounted: { root: Root; container: HTMLElement }[] = []

export const mount = (ui: ReactNode) => {
  const container = document.body.appendChild(document.createElement('div'))
  const root = createRoot(container)
  mounted.push({ root, container })
  act(() => root.render(ui))

  return {
    container,
    rerender: (next: ReactNode) => act(() => root.render(next)),
  }
}

/** Desmonta o que `mount` montou. Chame no `afterEach`. */
export const unmountAll = () => {
  for (const { root, container } of mounted.splice(0)) {
    act(() => root.unmount())
    container.remove()
  }
}

/** Digita num campo controlado: o React só vê a mudança pelo setter nativo do `value`. */
export const type = (input: HTMLInputElement, value: string) =>
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })

export const click = (element: HTMLElement) => act(() => element.click())

export const focus = (element: HTMLElement) => act(() => element.focus())

export const blur = (element: HTMLElement) => act(() => element.blur())

/** O jsdom não tem `matchMedia`: responde `true` só para as consultas pedidas. */
export const stubMatchMedia = (...matching: string[]) => {
  window.matchMedia = ((query: string) => ({
    matches: matching.includes(query),
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  })) as unknown as typeof window.matchMedia
}
