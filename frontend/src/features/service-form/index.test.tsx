import {
  MOCK_BUSINESS_CATEGORY,
  MOCK_PREVIEW_HOURS,
  MOCK_SERVICE_PROFESSIONALS,
  MOCK_SERVICE_VALUES,
} from './mock'
import { describe, expect, it } from 'vitest'
import {
  maskPrice,
  parseCents,
  parseMinutes,
  previewSlots,
  toServiceDraft,
  validateService,
} from './consts'

import { ServiceFormScreen } from '.'
import { renderToString } from 'react-dom/server'

// O React separa trechos de texto com `<!-- -->` no HTML do servidor; tiramos para comparar o texto.
const render = (values = MOCK_SERVICE_VALUES) =>
  renderToString(
    <ServiceFormScreen
      businessName="Estúdio Duartina"
      categoryName={MOCK_BUSINESS_CATEGORY}
      professionals={MOCK_SERVICE_PROFESSIONALS}
      initialValues={values}
      previewHours={MOCK_PREVIEW_HOURS}
    />,
  )
    .replaceAll('<!-- -->', '')
    .replaceAll(' ', ' ')

describe('ServiceFormScreen', () => {
  it('mostra o formulário do wireframe preenchido', () => {
    const html = render()

    expect(html).toContain('Novo serviço')
    expect(html).toContain('Estúdio Duartina · Beleza')
    expect(html).toContain('value="Corte masculino"')
    expect(html).toContain('value="R$ 45,00"')
    expect(html).toContain('Salvar serviço')
  })

  it('soma buffers e atendimento no que bloqueia a agenda', () => {
    const html = render()

    expect(html).toMatch(/Bloqueia na agenda<\/dt><dd[^>]*>45 min/)
  })

  it('mostra os horários que cabem no expediente e explica o primeiro corte', () => {
    const html = render()

    expect(html).toContain('Expediente 09:00–12:00, passo de 15 min')
    expect(html).toContain('>11:15</li>')
    expect(html).not.toContain('>11:30</li>')
    expect(html).toContain('11:30 não aparece: 45 min não cabem antes das 12:00.')
  })

  it('marca os profissionais escolhidos sem depender só de cor', () => {
    const pressed = [...render().matchAll(/aria-pressed="true"[^>]*>([^<]+)</g)].map(
      ([, name]) => name,
    )

    expect(pressed).toEqual(['Marina Souza', 'Rafael Lima'])
  })

  it('pede a duração antes de mostrar horários', () => {
    const html = render({ ...MOCK_SERVICE_VALUES, durationMinutes: '' })

    expect(html).toContain('Preencha a duração e a granularidade para ver os horários.')
  })
})

describe('cadastro de serviço', () => {
  it('lê tempo e preço como o Owner digita', () => {
    expect(parseMinutes('30 min')).toBe(30)
    expect(parseMinutes('')).toBeNull()
    expect(parseCents('R$ 45,00')).toBe(4_500)
    expect(parseCents('R$ 1.250,50')).toBe(125_050)
    expect(parseCents('abc')).toBeNull()
  })

  it('mascara o preço em reais a cada tecla, da direita para a esquerda', () => {
    const masked = (value: string) => maskPrice(value).replaceAll(' ', ' ')

    expect(masked('4')).toBe('R$ 0,04')
    expect(masked('4500')).toBe('R$ 45,00')
    expect(masked('R$ 45,005')).toBe('R$ 450,05')
    // Apagar o último dígito de "R$ 45,00" volta uma casa.
    expect(masked('R$ 45,0')).toBe('R$ 4,50')
    expect(masked('R$ 0,0')).toBe('')
    expect(masked('R$ 9.999.999,99')).toBe('R$ 9.999.999,99')
    expect(masked('R$ 9.999.999,990')).toBe('R$ 9.999.999,99')
  })

  it('aceita o exemplo do wireframe e o converte em centavos e minutos', () => {
    expect(validateService(MOCK_SERVICE_VALUES)).toEqual({})
    expect(toServiceDraft(MOCK_SERVICE_VALUES)).toEqual({
      name: 'Corte masculino',
      description: null,
      durationMinutes: 30,
      bufferBeforeMinutes: 5,
      bufferAfterMinutes: 10,
      slotStepMinutes: 15,
      priceCents: 4_500,
      professionalIds: ['marina-souza', 'rafael-lima'],
    })
  })

  it('aplica as invariantes do Service', () => {
    const errors = validateService({
      ...MOCK_SERVICE_VALUES,
      name: '  ',
      slotStepMinutes: '45 min',
      price: '',
      professionalIds: [],
    })

    expect(Object.keys(errors)).toEqual(['name', 'slotStepMinutes', 'price', 'professionalIds'])
    expect(errors.slotStepMinutes).toBe('Não pode passar da duração (30 min).')
  })

  it('não mostra horário quando a ocupação passa do expediente', () => {
    expect(previewSlots(MOCK_PREVIEW_HOURS, 240, 15)).toEqual({ slots: [], firstLeftOut: '09:00' })
    expect(previewSlots(MOCK_PREVIEW_HOURS, 60, 60).slots).toEqual(['09:00', '10:00', '11:00'])
    expect(previewSlots(MOCK_PREVIEW_HOURS, 60, 60).firstLeftOut).toBeNull()
  })
})
