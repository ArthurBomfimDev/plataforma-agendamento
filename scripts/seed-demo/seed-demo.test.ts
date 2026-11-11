/**
 * Testes do que o seed tem de puro: imagens, plano de fotos e folgas, datas. Rodam sem rede e sem banco:
 *
 *   bun test scripts/seed-demo
 */
import { describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { inflateSync } from 'node:zlib'
import { assetKey, imageFor } from './assets'
import {
  TIME_OFF_REASON,
  hasCover,
  professionalHasPhoto,
  serviceHasPhoto,
  serviceShowsPhotoInShowcase,
  timeOffPlan,
} from './plan'
import { crc32, hueOf, initialsOf, renderTilePng } from './png'
import { addDays, zonedToUtc } from './time'

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

describe('PNG gerado', () => {
  const png = renderTilePng('service', 'Corte masculino', 64)

  test('tem assinatura, dimensões e CRC de cada bloco válidos', () => {
    expect([...png.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

    const view = new DataView(png.buffer, png.byteOffset, png.byteLength)
    const types: string[] = []
    let offset = 8
    let idat: Uint8Array = new Uint8Array(0)
    while (offset < png.length) {
      const length = view.getUint32(offset)
      const type = String.fromCharCode(...png.subarray(offset + 4, offset + 8))
      const data = png.subarray(offset + 8, offset + 8 + length)
      expect(view.getUint32(offset + 8 + length)).toBe(crc32(png.subarray(offset + 4, offset + 8 + length)))
      if (type === 'IHDR') {
        expect(view.getUint32(offset + 8)).toBe(64)
        expect(view.getUint32(offset + 12)).toBe(64)
      }
      if (type === 'IDAT') idat = data
      types.push(type)
      offset += 12 + length
    }
    expect(types).toEqual(['IHDR', 'IDAT', 'IEND'])
    expect(inflateSync(idat).length).toBe((64 * 3 + 1) * 64)
  })

  test('é determinístico: a mesma entrada dá os mesmos bytes', () => {
    expect(renderTilePng('service', 'Corte masculino', 64)).toEqual(png)
  })

  test('entradas diferentes dão imagens diferentes', () => {
    expect(renderTilePng('service', 'Barba', 64)).not.toEqual(png)
    expect(renderTilePng('logo', 'Corte masculino', 64)).not.toEqual(png)
    expect(renderTilePng('service', 'Corte masculino', 64, 'Outro|Corte masculino')).not.toEqual(png)
  })

  test('o tamanho padrão cabe no limite de 5 MB do upload', () => {
    for (const kind of ['logo', 'cover', 'service', 'professional'] as const) {
      expect(renderTilePng(kind, 'Estúdio Duartina').length).toBeLessThan(MAX_UPLOAD_BYTES)
    }
  })
})

describe('iniciais e cor', () => {
  test('tira acento e conectivos', () => {
    expect(initialsOf('Estúdio Duartina')).toBe('ED')
    expect(initialsOf('Barbearia do Rogério')).toBe('BR')
    expect(initialsOf('Dra. Carla Nunes')).toBe('DC')
    expect(initialsOf('???')).toBe('V')
  })

  test('o matiz é estável e fica entre 0 e 359', () => {
    expect(hueOf('Estúdio Duartina')).toBe(hueOf('Estúdio Duartina'))
    for (const key of ['a', 'Barba', 'Pé e mão', 'x'.repeat(200)]) {
      expect(hueOf(key)).toBeGreaterThanOrEqual(0)
      expect(hueOf(key)).toBeLessThan(360)
    }
  })
})

describe('origem da imagem', () => {
  test('sem arquivo do Arthur, gera; com arquivo, usa o dele', () => {
    const dir = mkdtempSync(join(tmpdir(), 'seed-assets-'))
    try {
      expect(imageFor('service', 'Corte masculino', undefined, dir).source).toBe('gerada')

      mkdirSync(join(dir, 'service'))
      writeFileSync(join(dir, 'service', 'corte-masculino.jpg'), Uint8Array.from([0xff, 0xd8, 0xff]))
      const found = imageFor('service', 'Corte masculino', undefined, dir)
      expect(found.source).toBe('arquivo')
      expect(found.contentType).toBe('image/jpeg')
      expect(found.fileName).toBe('corte-masculino.jpg')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('a chave do arquivo não tem acento nem símbolo', () => {
    expect(assetKey('Estúdio Duartina')).toBe('estudio-duartina')
    expect(assetKey('  Pé & Mão! ')).toBe('pe-mao')
  })
})

describe('plano de fotos', () => {
  const businesses = Array.from({ length: 33 }, (_, index) => index)

  test('é função pura do índice', () => {
    expect(businesses.map((b) => serviceHasPhoto(b, 1))).toEqual(businesses.map((b) => serviceHasPhoto(b, 1)))
  })

  test('mostrar foto na vitrine só vale para serviço que tem foto, e há os dois casos', () => {
    const cases = businesses.flatMap((b) => [0, 1, 2, 3].map((s) => ({ photo: serviceHasPhoto(b, s), showcase: serviceShowsPhotoInShowcase(b, s) })))
    expect(cases.every(({ photo, showcase }) => photo || !showcase)).toBe(true)
    expect(cases.some(({ photo, showcase }) => photo && showcase)).toBe(true)
    expect(cases.some(({ photo, showcase }) => photo && !showcase)).toBe(true)
    expect(cases.some(({ photo }) => !photo)).toBe(true)
  })

  test('capa e foto de equipe variam, mas o dono sempre tem foto', () => {
    expect(businesses.some(hasCover)).toBe(true)
    expect(businesses.some((b) => !hasCover(b))).toBe(true)
    expect(businesses.every((b) => professionalHasPhoto(b, 0))).toBe(true)
    expect(businesses.some((b) => !professionalHasPhoto(b, 4))).toBe(true)
  })
})

describe('folgas', () => {
  test('equipe de um só não ganha folga', () => {
    expect(timeOffPlan(0, 1)).toEqual([])
  })

  test('o dono (posição 0) nunca folga e tudo cai depois dos 14 dias do histórico', () => {
    for (let business = 0; business < 33; business++) {
      for (const item of timeOffPlan(business, 4)) {
        expect(item.professionalIndex).toBeGreaterThan(0)
        expect(item.startOffsetDays).toBeGreaterThan(14)
        expect(item.endOffsetDays).toBeGreaterThan(item.startOffsetDays)
      }
    }
    expect(Array.from({ length: 33 }, (_, b) => timeOffPlan(b, 4).length).some((n) => n > 0)).toBe(true)
  })

  test('a marca deixa claro que é fictício', () => {
    expect(TIME_OFF_REASON).toContain('Demonstração')
  })
})

describe('datas', () => {
  test('meia-noite de São Paulo é 03:00 UTC (sem horário de verão desde 2019)', () => {
    expect(zonedToUtc('2026-11-20', '00:00:00', 'America/Sao_Paulo').toISOString()).toBe('2026-11-20T03:00:00.000Z')
  })

  test('soma dias de calendário atravessando mês e ano', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02')
    expect(addDays('2026-11-10', -10)).toBe('2026-10-31')
  })
})
