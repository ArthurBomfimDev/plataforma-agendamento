import { AnimatePresence, motion } from 'framer-motion'
import {
  EASE_OUT,
  EMAIL_FORMAT_ERROR,
  FORM_CLASSES,
  LINK_CLASSES,
  isValidEmail,
  validateSignIn,
} from './consts'
import { REDUCED_MOTION_QUERY, useMediaQuery } from '@hooks/use-media-query'
import type { SignInErrors, SignInScreenProps } from './types'
import { useEffect, useRef, useState } from 'react'

import { AuthLayout } from '@layouts/auth-layout'
import { Button } from '@components/button'
import { InlineAlert } from '@components/inline-alert'
import { PasswordField } from '@components/password-field'
import { SpinnerIcon } from '@assets/icons'
import { TextField } from '@components/text-field'
import { cn } from 'cn'

/**
 * Entrar (Figma, A01 · 1440px, A03 · 390px e os estados em A01s).
 *
 * Não há escolha de papel antes de entrar: a conta é única (§2.0) e a troca de contexto vem depois.
 */
export const SignInScreen = (props: SignInScreenProps) => {
  const {
    onSubmit,
    onForgotPassword,
    onCreateAccount,
    submitting,
    error,
    unconfirmed,
    onResendConfirmation,
    resending,
  } = props

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<SignInErrors>({})

  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const reducedMotion = useMediaQuery(REDUCED_MOTION_QUERY)

  // Os campos ficam desabilitados no envio e perdem o foco: a recusa devolve ao primeiro deles.
  useEffect(() => {
    if (error) emailRef.current?.focus()
  }, [error])

  const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()

    const values = { email: email.trim(), password }
    const nextErrors = validateSignIn(values)
    setErrors(nextErrors)

    // O foco vai para o primeiro campo com erro, e o leitor de tela lê a mensagem ligada a ele.
    if (nextErrors.email) emailRef.current?.focus()
    else if (nextErrors.password) passwordRef.current?.focus()
    else onSubmit?.(values)
  }

  return (
    <AuthLayout
      title="Entrar"
      description="Uma conta só: a mesma serve para agendar e para atender."
      footnote="Ao entrar, você concorda com os Termos de Uso e a Política de Privacidade."
    >
      <form
        noValidate
        onSubmit={handleSubmit}
        className={cn(FORM_CLASSES, submitting && '[&_label]:text-(--text-disabled)')}
      >
        {/* O alerta abre espaço aos poucos, em vez de empurrar os campos de uma vez. */}
        <AnimatePresence initial={false}>
          {error && (
            <motion.div
              key="error"
              initial={reducedMotion ? false : { height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={reducedMotion ? undefined : { height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
              className="overflow-hidden"
            >
              <InlineAlert>{error}</InlineAlert>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Conta que ainda não confirmou o e-mail: a saída fica ao lado da mensagem. */}
        {unconfirmed && (
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            disabled={resending}
            onClick={() => onResendConfirmation?.(email.trim())}
          >
            {resending ? 'Reenviando…' : 'Reenviar e-mail de confirmação'}
          </Button>
        )}

        <TextField
          ref={emailRef}
          id="sign-in-email"
          label="E-mail"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="voce@exemplo.com"
          value={email}
          disabled={submitting}
          onChange={(event) => {
            setEmail(event.target.value)
            setErrors((current) => ({ ...current, email: undefined }))
          }}
          // Só no blur: validar a cada tecla acusaria erro em todo e-mail pela metade. Campo vazio
          // não é formato errado; quem cobra o preenchimento é o envio.
          onBlur={() => {
            if (email.trim() && !isValidEmail(email)) {
              setErrors((current) => ({ ...current, email: EMAIL_FORMAT_ERROR }))
            }
          }}
          error={errors.email}
        />
        <PasswordField
          ref={passwordRef}
          id="sign-in-password"
          label="Senha"
          autoComplete="current-password"
          placeholder="Sua senha"
          value={password}
          disabled={submitting}
          onChange={(event) => {
            setPassword(event.target.value)
            setErrors((current) => ({ ...current, password: undefined }))
          }}
          error={errors.password}
        />

        <div className="flex justify-end">
          <button type="button" onClick={onForgotPassword} className={LINK_CLASSES}>
            Esqueci minha senha
          </button>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full disabled:bg-(--bg-disabled) disabled:text-(--text-disabled) disabled:opacity-100"
          disabled={submitting}
          aria-busy={submitting || undefined}
        >
          {submitting && (
            <SpinnerIcon
              aria-hidden="true"
              className="size-5 animate-spin motion-reduce:animate-none"
            />
          )}
          {submitting ? 'Entrando…' : 'Entrar'}
        </Button>

        <p className="type-body flex flex-wrap items-center justify-center gap-x-1.5 text-(--text-muted) auth:justify-start">
          Ainda não tem conta?
          <button type="button" onClick={onCreateAccount} className={LINK_CLASSES}>
            Criar conta
          </button>
        </p>
      </form>
    </AuthLayout>
  )
}
