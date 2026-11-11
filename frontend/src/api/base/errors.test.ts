import { ApiError, UserMessageError, errorMessage, isSlotRejection } from './errors'
import { describe, expect, it } from 'vitest'

describe('errorMessage', () => {
  it('mostra a mensagem que a própria aplicação escreveu', () => {
    const message = 'Não foi possível localizar o endereço. Confira os dados.'

    expect(errorMessage(new UserMessageError(message))).toBe(message)
  })

  it('não vaza texto técnico de um erro qualquer', () => {
    expect(errorMessage(new TypeError('x is undefined'))).toBe('Algo deu errado. Tente de novo.')
  })

  it('o código da API continua decidindo a mensagem', () => {
    expect(errorMessage(new ApiError(400, 'consent.version_outdated'))).toContain('mudou')
  })

  it('cancelar fora do prazo diz o que fazer em seguida', () => {
    expect(errorMessage(new ApiError(409, 'appointment.cannot_cancel_inside_window'))).toBe(
      'O prazo para cancelar este agendamento já passou. Fale com o estabelecimento.',
    )
  })

  it('cada recusa de horário diz o motivo; só a disputa fala em "ocupado"', () => {
    const busy = errorMessage(new ApiError(409, 'appointment.slot_no_longer_available'))
    const reasons = [
      'appointment.lead_time_not_met',
      'appointment.outside_work_hours',
      'appointment.closed_holiday',
      'appointment.professional_unavailable',
      'appointment.beyond_booking_horizon',
      'appointment.slot_not_on_grid',
    ].map((code) => errorMessage(new ApiError(422, code)))

    expect(busy).toContain('ocupado')
    reasons.forEach((message) => {
      expect(message).not.toContain('ocupado')
      expect(message).not.toBe('Algo deu errado. Tente de novo.')
    })
    expect(new Set([busy, ...reasons]).size).toBe(7)
  })

  it('isSlotRejection reconhece todos os códigos de horário e nenhum outro', () => {
    expect(isSlotRejection('appointment.lead_time_not_met')).toBe(true)
    expect(isSlotRejection('appointment.slot_no_longer_available')).toBe(true)
    expect(isSlotRejection('appointment.not_found')).toBe(false)
    expect(isSlotRejection(undefined)).toBe(false)
  })

  it('o convite com especialidade grande demais tem mensagem própria', () => {
    expect(errorMessage(new ApiError(400, 'invitation.specialty_invalid'))).toBe(
      'A especialidade pode ter até 80 caracteres.',
    )
  })
})
