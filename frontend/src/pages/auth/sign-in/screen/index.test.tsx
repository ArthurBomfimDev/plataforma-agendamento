// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { blur, click, focus, mount, stubMatchMedia, type, unmountAll } from '@utils/test-dom'

import { SignInScreen } from '.'
import type { SignInScreenProps } from './types'
import { act } from 'react'
import { validateSignIn } from './consts'

const FORMAT_ERROR = 'Digite um e-mail completo, com @ e domínio.'

const screen = (props: SignInScreenProps = {}) => {
  const { container, rerender } = mount(<SignInScreen {...props} />)
  const find = <T extends HTMLElement>(selector: string) => container.querySelector<T>(selector)!

  return {
    container,
    rerender: (next: SignInScreenProps) => rerender(<SignInScreen {...next} />),
    email: find<HTMLInputElement>('#sign-in-email'),
    password: find<HTMLInputElement>('#sign-in-password'),
    toggle: find<HTMLButtonElement>('button[aria-controls="sign-in-password"]'),
    submit: find<HTMLButtonElement>('button[type="submit"]'),
    form: find<HTMLFormElement>('form'),
    alert: () => container.querySelector('[role="alert"]'),
  }
}

const send = (form: HTMLFormElement) => act(() => form.requestSubmit())

beforeEach(() => stubMatchMedia())
afterEach(unmountAll)

describe('SignInScreen', () => {
  describe('1 · repouso', () => {
    it('mostra o formulário sem seletor de papel, com rótulos e preenchimento do navegador', () => {
      const { container, email, password, submit } = screen()

      expect(container.querySelector('h1')?.textContent).toBe('Entrar')
      expect(container.textContent).not.toContain('Sou consumidor')
      expect(container.textContent).not.toContain('Sou estabelecimento')
      expect(container.textContent).not.toContain('Manter conectado')

      expect(container.querySelector('label[for="sign-in-email"]')).not.toBeNull()
      expect(container.querySelector('label[for="sign-in-password"]')).not.toBeNull()
      expect(email.autocomplete).toBe('email')
      expect(email.inputMode).toBe('email')
      expect(password.autocomplete).toBe('current-password')
      expect(email.placeholder).toBe('voce@exemplo.com')

      expect(submit.disabled).toBe(false)
      expect(submit.textContent).toBe('Entrar')
    })

    it('segue a ordem de tabulação do formulário', () => {
      const { form } = screen()
      const order = [...form.querySelectorAll<HTMLElement>('input, button')].map(
        (element) => element.getAttribute('aria-label') ?? element.id ?? '',
      )
      const texts = [...form.querySelectorAll('button')].map((button) => button.textContent)

      expect(order.slice(0, 3)).toEqual(['sign-in-email', 'sign-in-password', 'Mostrar senha'])
      expect(texts.slice(1)).toEqual(['Esqueci minha senha', 'Entrar', 'Criar conta'])
    })
  })

  describe('2 · foco no e-mail', () => {
    it('focar não acusa erro', () => {
      const { container, email } = screen()

      focus(email)

      expect(document.activeElement).toBe(email)
      expect(container.textContent).not.toContain(FORMAT_ERROR)
    })
  })

  describe('3 · erro de validação', () => {
    it('não acusa enquanto digita, acusa no blur e limpa no primeiro caractere', () => {
      const { container, email } = screen()

      focus(email)
      type(email, 'arthur@exemplo')
      expect(container.textContent).not.toContain(FORMAT_ERROR)

      blur(email)
      expect(container.textContent).toContain(FORMAT_ERROR)
      expect(email.getAttribute('aria-invalid')).toBe('true')
      expect(email.getAttribute('aria-describedby')).toBe('sign-in-email-helper')

      focus(email)
      type(email, 'arthur@exemplo.')
      expect(container.textContent).not.toContain(FORMAT_ERROR)
      expect(email.hasAttribute('aria-invalid')).toBe(false)
    })

    it('sair do campo vazio não acusa', () => {
      const { container, email } = screen()

      focus(email)
      blur(email)

      expect(container.textContent).not.toContain(FORMAT_ERROR)
    })

    it('no envio com erro, o foco vai para o primeiro campo com problema e nada é enviado', () => {
      const onSubmit = vi.fn()
      const { email, password, form } = screen({ onSubmit })

      send(form)
      expect(document.activeElement).toBe(email)

      type(email, 'arthur@exemplo.com')
      send(form)
      expect(document.activeElement).toBe(password)
      expect(password.getAttribute('aria-invalid')).toBe('true')

      expect(onSubmit).not.toHaveBeenCalled()
    })
  })

  describe('4 · credencial inválida', () => {
    const error = 'E-mail ou senha incorretos. Confira e tente de novo.'

    it('alerta acima dos campos, mantém o que foi digitado e devolve o foco ao e-mail', () => {
      const onSubmit = vi.fn()
      const view = screen({ onSubmit })

      type(view.email, 'arthur@exemplo.com')
      type(view.password, 'minhasenha123')
      send(view.form)
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'arthur@exemplo.com',
        password: 'minhasenha123',
      })

      view.rerender({ onSubmit, submitting: true })
      view.rerender({ onSubmit, error })

      const alert = view.alert()!
      expect(alert.textContent).toBe(error)
      expect(
        alert.compareDocumentPosition(view.email) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
      expect(view.email.value).toBe('arthur@exemplo.com')
      expect(view.password.value).toBe('minhasenha123')
      expect(document.activeElement).toBe(view.email)
    })

    it('conta sem e-mail confirmado: mensagem e reenvio para o e-mail digitado', () => {
      const onResendConfirmation = vi.fn()
      const { container, alert, email } = screen({
        unconfirmed: true,
        error: 'Confirme seu e-mail para entrar.',
        onResendConfirmation,
      })

      type(email, 'arthur@exemplo.com')
      expect(alert()?.textContent).toContain('Confirme seu e-mail para entrar')

      const resend = [...container.querySelectorAll('button')].find((button) =>
        button.textContent?.includes('Reenviar e-mail de confirmação'),
      )!
      click(resend)

      expect(onResendConfirmation).toHaveBeenCalledWith('arthur@exemplo.com')
    })

    it('sem esse erro, não oferece reenvio', () => {
      expect(screen().container.textContent).not.toContain('Reenviar e-mail de confirmação')
    })
  })

  describe('5 · enviando', () => {
    it('campos e botão desabilitados, botão ocupado com o indicador de progresso', () => {
      const { email, password, toggle, submit } = screen({ submitting: true })

      expect(email.disabled).toBe(true)
      expect(password.disabled).toBe(true)
      expect(toggle.disabled).toBe(true)
      expect(submit.disabled).toBe(true)
      expect(submit.textContent).toBe('Entrando…')
      expect(submit.getAttribute('aria-busy')).toBe('true')
      expect(submit.querySelector('svg')).not.toBeNull()
    })
  })

  describe('6 · senha visível', () => {
    it('o alternador troca o tipo, o estado e o nome, e devolve o foco sem enviar', () => {
      const onSubmit = vi.fn()
      const { password, toggle } = screen({ onSubmit })

      expect(toggle.type).toBe('button')
      expect(password.type).toBe('password')
      expect(toggle.getAttribute('aria-pressed')).toBe('false')
      expect(toggle.getAttribute('aria-label')).toBe('Mostrar senha')

      focus(toggle)
      click(toggle)

      expect(password.type).toBe('text')
      expect(toggle.getAttribute('aria-pressed')).toBe('true')
      expect(toggle.getAttribute('aria-label')).toBe('Ocultar senha')
      expect(document.activeElement).toBe(password)
      expect(onSubmit).not.toHaveBeenCalled()

      click(toggle)

      expect(password.type).toBe('password')
      expect(toggle.getAttribute('aria-pressed')).toBe('false')
    })
  })
})

describe('validateSignIn', () => {
  const valid = { email: 'voce@exemplo.com', password: '12345678' }

  it('aceita e-mail e senha válidos', () => {
    expect(validateSignIn(valid)).toEqual({})
  })

  it('recusa e-mail sem domínio ou vazio', () => {
    expect(validateSignIn({ ...valid, email: 'voce@exemplo' }).email).toBe(FORMAT_ERROR)
    expect(validateSignIn({ ...valid, email: '' }).email).toBeDefined()
  })

  it('exige no mínimo 8 caracteres na senha', () => {
    expect(validateSignIn({ ...valid, password: '1234567' }).password).toBeDefined()
    expect(validateSignIn({ ...valid, password: '12345678' }).password).toBeUndefined()
  })
})
