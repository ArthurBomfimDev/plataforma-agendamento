import {
  EMPTY_SERVICE_VALUES,
  durationLabel,
  durationOptions,
  maskPrice,
  stepGap,
  parseCents,
  parseMinutes,
  previewSlots,
  toFormValues,
  toServiceDraft,
  validateService,
} from './consts'
import {
  FIXTURE_BUSINESS_CATEGORY,
  FIXTURE_PREVIEW_HOURS,
  FIXTURE_SERVICE_PROFESSIONALS,
  FIXTURE_SERVICE_VALUES,
} from './fixtures'
import { describe, expect, it } from 'vitest'

import { ServiceFormScreen } from '.'
import type { ServiceFormScreenProps } from './types'
import { renderToString } from 'react-dom/server'

/** O `Intl` separa "R$" do valor com espaço não separável. */
const NBSP = ' '

// O React separa trechos de texto com `<!-- -->` no HTML do servidor; tiramos para comparar o texto.
const render = (overrides: Partial<ServiceFormScreenProps> = {}) =>
  renderToString(
    <ServiceFormScreen
      businessName="Estúdio Duartina"
      categoryName={FIXTURE_BUSINESS_CATEGORY}
      professionals={FIXTURE_SERVICE_PROFESSIONALS}
      initialValues={FIXTURE_SERVICE_VALUES}
      previewHours={FIXTURE_PREVIEW_HOURS}
      {...overrides}
    />,
  )
    .replaceAll('<!-- -->', '')
    .replaceAll(NBSP, ' ')

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
    const html = render({ initialValues: { ...FIXTURE_SERVICE_VALUES, durationMinutes: '' } })

    expect(html).toContain('Preencha a duração e a granularidade para ver os horários.')
  })

  it('edita um serviço existente com outro título e outro aviso de descarte', () => {
    const html = render({ mode: 'edit' })

    expect(html).toContain('Editar serviço')
    expect(html).not.toContain('Novo serviço')
  })

  it('sem jornada cadastrada, explica em vez de inventar um expediente', () => {
    const html = render({ previewHours: null })

    expect(html).toContain('Cadastre a jornada de quem executa o serviço para ver os horários.')
    expect(html).not.toContain('Expediente')
  })

  it('em Saúde, avisa que nome e descrição vão para a vitrine', () => {
    expect(render({ sensitive: true })).toContain('Estabelecimento de saúde')
    expect(render()).not.toContain('Estabelecimento de saúde')
  })

  it('desliga os botões enquanto salva e mostra o erro da API', () => {
    const html = render({ saving: true, error: 'Cada intervalo vai de 0 a 120 minutos.' })

    expect(html).toContain('Salvando…')
    expect(html).toMatch(/<button[^>]*type="submit"[^>]*disabled=""/)
    expect(html).toContain('role="alert"')
    expect(html).toContain('Cada intervalo vai de 0 a 120 minutos.')
  })

  it('tempos são seletores, não texto livre, e a duração oferece múltiplos do passo', () => {
    const html = render()

    for (const id of [
      'service-duration',
      'service-buffer-before',
      'service-buffer-after',
      'service-slot-step',
    ]) {
      expect(html).toMatch(new RegExp(`<select[^>]*id="${id}"`))
      expect(html).not.toMatch(new RegExp(`<input[^>]*id="${id}"`))
    }
    expect(html).toMatch(/<option value="30" selected="">30 min<\/option>/)
    expect(html).toContain('<option value="45">45 min</option>')
    expect(html).not.toContain('<option value="40">')
  })

  it('avisa os minutos soltos e sugere a duração que fecha com o passo', () => {
    const html = render({
      initialValues: {
        ...FIXTURE_SERVICE_VALUES,
        durationMinutes: '45 min',
        bufferBeforeMinutes: '0 min',
        bufferAfterMinutes: '0 min',
        slotStepMinutes: '30 min',
      },
    })

    expect(html).toContain('sobram 15 min soltos')
    expect(html).toContain('Ajustar a duração para 1 h')
    expect(render()).not.toContain('soltos')
  })

  it('sem profissional ativo, explica onde cadastrar', () => {
    expect(render({ professionals: [] })).toContain('Nenhum profissional ativo')
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
    const masked = (value: string) => maskPrice(value).replaceAll(NBSP, ' ')

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
    expect(validateService(FIXTURE_SERVICE_VALUES)).toEqual({})
    expect(toServiceDraft(FIXTURE_SERVICE_VALUES)).toEqual({
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
      ...FIXTURE_SERVICE_VALUES,
      name: '  ',
      slotStepMinutes: '45 min',
      price: '',
      professionalIds: [],
    })

    expect(Object.keys(errors)).toEqual(['name', 'slotStepMinutes', 'price', 'professionalIds'])
    expect(errors.slotStepMinutes).toBe('Não pode passar da duração (30 min).')
  })

  it('aplica os limites do domínio antes de a API recusar', () => {
    const errors = validateService({
      ...FIXTURE_SERVICE_VALUES,
      durationMinutes: '481 min',
      bufferBeforeMinutes: '121 min',
      slotStepMinutes: '4 min',
    })

    expect(errors.durationMinutes).toBe('Até 480 min (8 h).')
    expect(errors.bufferBeforeMinutes).toBe('Até 120 min.')
    expect(errors.bufferAfterMinutes).toBeUndefined()
    expect(errors.slotStepMinutes).toBe('O mínimo é 5 min.')
  })

  it('sem ninguém para escolher, não exige profissional', () => {
    expect(validateService({ ...FIXTURE_SERVICE_VALUES, professionalIds: [] }, false)).toEqual({})
  })

  it('oferece durações em múltiplos do passo até 8 h, sem perder um valor antigo', () => {
    expect(durationOptions(60, null)).toEqual([60, 120, 180, 240, 300, 360, 420, 480])
    expect(durationOptions(30, 45)).toEqual([
      30, 45, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360, 390, 420, 450, 480,
    ])
    expect(durationOptions(15, null).at(-1)).toBe(480)
    expect(durationLabel(90)).toBe('1 h 30')
    expect(durationLabel(120)).toBe('2 h')
    expect(durationLabel(45)).toBe('45 min')
  })

  it('conta os minutos soltos com os intervalos, porque eles também ocupam a agenda', () => {
    const base = { ...FIXTURE_SERVICE_VALUES, slotStepMinutes: '30 min' }

    expect(
      stepGap({
        ...base,
        durationMinutes: '45 min',
        bufferBeforeMinutes: '0 min',
        bufferAfterMinutes: '0 min',
      }),
    ).toEqual({
      occupancy: 45,
      leftover: 15,
      suggested: 60,
    })
    // 10 + 40 + 10 = 60: fecha com o passo, sem aviso.
    expect(
      stepGap({
        ...base,
        durationMinutes: '40 min',
        bufferBeforeMinutes: '10 min',
        bufferAfterMinutes: '10 min',
      }),
    ).toBeNull()
    // Perto do limite, não sugere passar de 8 h: 15 + 470 = 485, e fechar exigiria 495 min de duração.
    expect(
      stepGap({
        ...base,
        durationMinutes: '470 min',
        bufferBeforeMinutes: '15 min',
        bufferAfterMinutes: '0 min',
      })?.suggested,
    ).toBeNull()
  })

  it('começa um serviço novo com os padrões do domínio', () => {
    expect(EMPTY_SERVICE_VALUES).toMatchObject({
      name: '',
      bufferBeforeMinutes: '0 min',
      slotStepMinutes: '15 min',
      professionalIds: [],
    })
  })

  it('carrega um serviço da API nos campos', () => {
    const values = toFormValues({
      name: 'Escova',
      description: null,
      durationMinutes: 45,
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 10,
      slotStepMinutes: 15,
      priceCents: 6_000,
      professionals: [{ professionalId: 'p1' }],
    })

    expect({ ...values, price: values.price.replaceAll(NBSP, ' ') }).toEqual({
      name: 'Escova',
      description: '',
      durationMinutes: '45 min',
      bufferBeforeMinutes: '0 min',
      bufferAfterMinutes: '10 min',
      slotStepMinutes: '15 min',
      price: 'R$ 60,00',
      professionalIds: ['p1'],
    })
    expect(validateService(values)).toEqual({})
  })

  it('não mostra horário quando a ocupação passa do expediente', () => {
    expect(previewSlots(FIXTURE_PREVIEW_HOURS, 240, 15)).toEqual({
      slots: [],
      firstLeftOut: '09:00',
    })
    expect(previewSlots(FIXTURE_PREVIEW_HOURS, 60, 60).slots).toEqual(['09:00', '10:00', '11:00'])
    expect(previewSlots(FIXTURE_PREVIEW_HOURS, 60, 60).firstLeftOut).toBeNull()
  })
})
