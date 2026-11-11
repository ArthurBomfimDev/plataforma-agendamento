import { describe, expect, it, vi } from 'vitest'
import { normalizeTime, timeOptions } from './consts'

import { TimeField } from '.'
import { renderToString } from 'react-dom/server'

describe('timeOptions', () => {
  it('de 15 em 15 minutos, do começo ao fim do dia', () => {
    const options = timeOptions(15)

    expect(options).toHaveLength(96)
    expect(options[0]).toBe('00:00')
    expect(options[1]).toBe('00:15')
    expect(options.at(-1)).toBe('23:45')
    expect(options).toContain('14:30')
    expect(options).not.toContain('14:20')
  })

  it('o passo vem do chamador', () => {
    expect(timeOptions(30)).toHaveLength(48)
  })

  it('o horário salvo fora da grade continua na lista, para não ser trocado em silêncio', () => {
    const options = timeOptions(15, '09:05')

    expect(options).toContain('09:05')
    expect(options.indexOf('09:05')).toBe(options.indexOf('09:00') + 1)
    expect(options).toHaveLength(97)
  })

  it('horário que já está na grade não duplica', () => {
    expect(timeOptions(15, '09:15')).toHaveLength(96)
  })

  it('o fim do dia é uma opção própria, e só quando pedida', () => {
    expect(timeOptions(15, undefined, { endOfDay: true }).at(-1)).toBe('23:59')
    expect(timeOptions(15)).not.toContain('23:59')
  })
})

describe('normalizeTime', () => {
  it('aceita HH:mm e HH:mm:ss, e devolve HH:mm', () => {
    expect(normalizeTime('09:00')).toBe('09:00')
    expect(normalizeTime('09:00:00')).toBe('09:00')
  })

  it('o que não é horário vira vazio', () => {
    expect(normalizeTime('')).toBe('')
    expect(normalizeTime('9h')).toBe('')
  })
})

describe('TimeField', () => {
  const render = (props: Partial<Parameters<typeof TimeField>[0]> = {}) =>
    renderToString(
      <TimeField id="t" label="Início" value="09:00" onValueChange={vi.fn()} {...props} />,
    )

  it('o rótulo fica visível e liga ao campo', () => {
    const html = render()

    expect(html).toContain('Início')
    expect(html).toMatch(/<label[^>]*for="t"/)
  })

  it('é uma lista nativa com o valor atual selecionado', () => {
    const html = render({ value: '14:30' })

    expect(html).toContain('<select')
    expect(html).toMatch(/<option[^>]*value="14:30"[^>]*selected|selected[^>]*value="14:30"/)
  })

  it('alvo de toque de 44 px e fonte de 16 px, pelos tokens do campo', () => {
    const html = render()

    expect(html).toContain('min-h-(--size-touch-min)')
    expect(html).toContain('text-(length:--size-input)')
  })

  it('sem valor, mostra o marcador e não inventa horário', () => {
    const html = render({ value: '' })

    expect(html).toContain('--:--')
  })

  it('o erro aparece com a ligação de acessibilidade', () => {
    const html = render({ error: 'Informe o horário.' })

    expect(html).toContain('Informe o horário.')
    expect(html).toContain('aria-invalid="true"')
    expect(html).toContain('aria-describedby="t-error"')
  })
})
