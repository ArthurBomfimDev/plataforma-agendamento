// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { click, mount, stubMatchMedia, type, unmountAll } from '@utils/test-dom'

import { CompleteProfileScreen } from '.'
import type { CompleteProfileScreenProps } from './types'
import { act } from 'react'
import { validateCompleteProfile } from './consts'

const READY = { status: 'ready', fullName: 'Ana Souza', alreadyComplete: false } as const

const screen = (props: Partial<CompleteProfileScreenProps> = {}) => {
  const { container } = mount(<CompleteProfileScreen data={READY} {...props} />)
  const find = <T extends HTMLElement>(selector: string) => container.querySelector<T>(selector)

  return {
    container,
    birthDate: () => find<HTMLInputElement>('#complete-profile-birth-date'),
    socialName: () => find<HTMLInputElement>('#complete-profile-social-name'),
    form: () => find<HTMLFormElement>('form'),
    alert: () => container.querySelector('[role="alert"]'),
  }
}

const send = (form: HTMLFormElement | null) => act(() => form?.requestSubmit())

beforeEach(() => stubMatchMedia())
afterEach(unmountAll)

describe('CompleteProfileScreen', () => {
  it('carregando: avisa e não mostra o formulário', () => {
    const { container, form } = screen({ data: { status: 'loading' } })

    expect(container.querySelector('[role="status"]')?.textContent).toContain('Carregando')
    expect(form()).toBeNull()
  })

  it('erro: mostra a mensagem e deixa tentar de novo', () => {
    const onRetry = vi.fn()
    const { container, form } = screen({
      data: { status: 'error', message: 'Sem conexão.', onRetry },
    })

    expect(container.querySelector('[role="alert"]')?.textContent).toBe('Sem conexão.')
    expect(form()).toBeNull()
    click(
      [...container.querySelectorAll('button')].find((b) => b.textContent === 'Tentar de novo')!,
    )
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('vazio: quem já tem perfil só continua', () => {
    const onContinue = vi.fn()
    const { container, form } = screen({
      data: { status: 'ready', fullName: 'Ana Souza', alreadyComplete: true },
      onContinue,
    })

    expect(container.textContent).toContain('já está completo')
    expect(form()).toBeNull()
    click([...container.querySelectorAll('button')].find((b) => b.textContent === 'Continuar')!)
    expect(onContinue).toHaveBeenCalledOnce()
  })

  it('sucesso: com a data, envia data e nome social sem espaços sobrando', () => {
    const onSubmit = vi.fn()
    const { birthDate, socialName, form, alert } = screen({ onSubmit })

    type(birthDate()!, '1995-05-10')
    type(socialName()!, '  Ana  ')
    send(form())

    expect(onSubmit).toHaveBeenCalledWith({ birthDate: '1995-05-10', socialName: 'Ana' })
    expect(alert()).toBeNull()
  })

  it('sem a data, não envia e aponta o campo', () => {
    const onSubmit = vi.fn()
    const { birthDate, form, container } = screen({ onSubmit })

    send(form())

    expect(onSubmit).not.toHaveBeenCalled()
    expect(container.textContent).toContain('Informe sua data de nascimento')
    expect(document.activeElement).toBe(birthDate())
  })

  it('mostra o erro da tentativa e não envia duas vezes enquanto salva', () => {
    const onSubmit = vi.fn()
    const { birthDate, form, container } = screen({
      onSubmit,
      submitting: true,
      error: 'É preciso ter 18 anos.',
    })

    type(birthDate()!, '1995-05-10')
    send(form())

    expect(container.querySelector('[role="alert"]')?.textContent).toBe('É preciso ter 18 anos.')
    expect(onSubmit).not.toHaveBeenCalled()
  })
})

describe('validateCompleteProfile', () => {
  const today = '2026-11-10'

  it('aceita uma data passada', () => {
    expect(validateCompleteProfile({ birthDate: '1995-05-10', socialName: '' }, today)).toEqual({})
  })

  it('recusa vazia, de hoje e do futuro', () => {
    for (const birthDate of ['', today, '2030-01-01']) {
      expect(validateCompleteProfile({ birthDate, socialName: '' }, today).birthDate).toBeDefined()
    }
  })
})
