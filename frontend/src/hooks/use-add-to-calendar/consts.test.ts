import { describe, expect, it } from 'vitest'
import {
  calendarTitle,
  googleCalendarUrl,
  mapLink,
  outlookCalendarUrl,
  toIcs,
  zonedToUtc,
} from './consts'

import type { CalendarEvent } from './types'

const event: CalendarEvent = {
  id: 'a1b2c3',
  title: 'Corte — Estúdio Duartina',
  location: 'Rua das Flores, 100, Centro, Garça',
  date: '2026-11-04',
  time: '14:00',
  durationMinutes: 45,
  timeZone: 'America/Sao_Paulo',
}

describe('zonedToUtc', () => {
  it('converte a hora de parede do fuso para UTC', () => {
    // São Paulo está em UTC−3 (sem horário de verão desde 2019).
    expect(zonedToUtc('2026-11-04', '14:00', 'America/Sao_Paulo').toISOString()).toBe(
      '2026-11-04T17:00:00.000Z',
    )
  })

  it('respeita o horário de verão: o mesmo relógio vira UTC diferente no verão e no inverno', () => {
    expect(zonedToUtc('2026-07-15', '09:30', 'America/New_York').toISOString()).toBe(
      '2026-07-15T13:30:00.000Z',
    )
    expect(zonedToUtc('2026-01-15', '09:30', 'America/New_York').toISOString()).toBe(
      '2026-01-15T14:30:00.000Z',
    )
  })
})

describe('links das agendas web', () => {
  it('Google Agenda: link de criação pré-preenchido, com início e fim em UTC', () => {
    const url = new URL(googleCalendarUrl(event))

    expect(url.origin + url.pathname).toBe('https://calendar.google.com/calendar/render')
    expect(url.searchParams.get('action')).toBe('TEMPLATE')
    expect(url.searchParams.get('text')).toBe('Corte — Estúdio Duartina')
    expect(url.searchParams.get('dates')).toBe('20261104T170000Z/20261104T174500Z')
    expect(url.searchParams.get('location')).toBe('Rua das Flores, 100, Centro, Garça')
    expect(url.searchParams.get('details')).toContain(mapLink(event.location!))
  })

  it('Outlook: link de composição equivalente, em UTC', () => {
    const url = new URL(outlookCalendarUrl(event))

    expect(url.origin + url.pathname).toBe('https://outlook.live.com/calendar/0/deeplink/compose')
    expect(url.searchParams.get('rru')).toBe('addevent')
    expect(url.searchParams.get('subject')).toBe('Corte — Estúdio Duartina')
    expect(url.searchParams.get('startdt')).toBe('2026-11-04T17:00:00.000Z')
    expect(url.searchParams.get('enddt')).toBe('2026-11-04T17:45:00.000Z')
    expect(url.searchParams.get('location')).toBe('Rua das Flores, 100, Centro, Garça')
  })

  it('sem endereço, não manda local nem detalhes', () => {
    const bare = { ...event, location: undefined }

    expect(new URL(googleCalendarUrl(bare)).searchParams.has('location')).toBe(false)
    expect(new URL(googleCalendarUrl(bare)).searchParams.has('details')).toBe(false)
    expect(new URL(outlookCalendarUrl(bare)).searchParams.has('body')).toBe(false)
  })
})

describe('título do evento', () => {
  it('em Saúde leva só o estabelecimento, sem o serviço', () => {
    expect(
      calendarTitle({
        serviceName: 'Sessão de psicoterapia',
        businessName: 'Clínica Vida',
        sensitive: true,
      }),
    ).toBe('Atendimento — Clínica Vida')
  })

  it('fora de Saúde leva o serviço e o estabelecimento', () => {
    expect(calendarTitle({ serviceName: 'Corte', businessName: 'Estúdio Duartina' })).toBe(
      'Corte — Estúdio Duartina',
    )
  })
})

describe('arquivo .ics', () => {
  const ics = toIcs(event)

  it('tem UID estável, sequência, endereço com o link do mapa e lembrete de 1 hora antes', () => {
    expect(ics).toContain('UID:a1b2c3@booking')
    expect(ics).toContain('SEQUENCE:0')
    expect(ics).toContain('LOCATION:Rua das Flores\\, 100\\, Centro\\, Garça')
    expect(ics).toContain('DESCRIPTION:Mapa: https://www.google.com/maps/search/')
    expect(ics).toContain('BEGIN:VALARM')
    expect(ics).toContain('TRIGGER:-PT1H')
  })

  it('o mesmo agendamento exportado duas vezes tem o mesmo UID', () => {
    expect(toIcs(event).match(/UID:.*/)?.[0]).toBe(ics.match(/UID:.*/)?.[0])
  })
})
