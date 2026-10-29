import { describe, expect, it } from 'vitest'
import { toPolicy, toPolicyValues, validatePolicy } from './consts'

import type { SchedulingPolicyResponse } from '@lib/api/types'
import { SettingsScreen } from '.'
import type { SettingsScreenProps } from './types'
import { renderToString } from 'react-dom/server'

const policy: SchedulingPolicyResponse = {
  autoConfirm: false,
  pendingExpirationHours: 12,
  minLeadTimeHours: 2,
  bookingHorizonDays: 60,
  cancellationWindowHours: 24,
  timeZone: 'America/Sao_Paulo',
}

const render = (overrides: Partial<SettingsScreenProps> = {}) =>
  renderToString(
    <SettingsScreen
      data={{ status: 'ready', policy }}
      businessName="Estúdio Duartina"
      {...overrides}
    />,
  ).replaceAll('<!-- -->', '')

describe('SettingsScreen', () => {
  it('mostra a política atual, com o estado da confirmação automática em texto', () => {
    const html = render()

    expect(html).toContain('Confirmação automática')
    expect(html).toContain('Cada pedido espera você aceitar ou recusar.')
    expect(html).toContain('>Desligada<')
    expect(html).toMatch(/id="settings-pendingExpirationHours"[^>]*value="12"/)
    expect(html).toMatch(/id="settings-bookingHorizonDays"[^>]*value="60"/)
    expect(html).toContain('America/Sao_Paulo')
  })

  it('só deixa salvar depois de mudar algo', () => {
    expect(render()).toMatch(/<button[^>]*type="submit"[^>]*disabled=""/)
  })

  it('mostra o carregando e o erro com "Tentar de novo"', () => {
    expect(render({ data: { status: 'loading' } })).toContain('Carregando as configurações…')

    const html = render({
      data: { status: 'error', message: 'Sem conexão com o servidor.', onRetry: () => undefined },
    })
    expect(html).toContain('Sem conexão com o servidor.')
    expect(html).toContain('Tentar de novo')
  })
})

describe('política de agendamento', () => {
  it('aplica os limites do Business antes de a API recusar', () => {
    const values = toPolicyValues(policy)

    expect(validatePolicy(values)).toEqual({})
    expect(
      validatePolicy({
        ...values,
        pendingExpirationHours: '0',
        minLeadTimeHours: '73',
        bookingHorizonDays: '1,5',
        cancellationWindowHours: '',
      }),
    ).toEqual({
      pendingExpirationHours: 'De 1 a 72 horas.',
      minLeadTimeHours: 'De 0 a 72 horas.',
      bookingHorizonDays: 'De 1 a 365 dias.',
      cancellationWindowHours: 'De 0 a 48 horas.',
    })
  })

  it('converte o formulário de volta em números', () => {
    expect(
      toPolicy({ ...toPolicyValues(policy), autoConfirm: true, minLeadTimeHours: '0' }),
    ).toEqual({
      autoConfirm: true,
      pendingExpirationHours: 12,
      minLeadTimeHours: 0,
      bookingHorizonDays: 60,
      cancellationWindowHours: 24,
    })
  })
})
