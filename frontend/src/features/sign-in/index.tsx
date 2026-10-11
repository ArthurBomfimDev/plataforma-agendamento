import { AnimatePresence, MotionConfig, motion, useAnimate, useReducedMotion } from 'framer-motion'
import {
  EASE_OUT,
  PASSWORD_MIN_LENGTH,
  ROLE_OPTIONS,
  ROLE_SUBTITLES,
  fadeUp,
  stagger,
  validateSignIn,
} from './consts'
import type { SignInErrors, SignInRole, SignInScreenProps } from './types'
import { useRef, useState } from 'react'

import { Button } from '../../components/button'
import { HeroPanel } from './components/hero-panel'
import { Logotype } from '../../components/logotype'
import { SegmentedControl } from '../../components/segmented-control'
import { TextField } from '../../components/text-field'

/** Link de texto com alvo de toque de 44px: 20px de linha + 12px acima e abaixo. */
const LINK_CLASSES =
  'type-label -my-(--space-12) py-(--space-12) text-(--text-link) hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)'

/**
 * Entrar (Figma, A03 · 390px; desktop: A01 · 1440px).
 *
 * Fica fora da moldura com a barra superior: a tela é a própria porta de entrada.
 */
export const SignInScreen = (props: SignInScreenProps) => {
  const { onSubmit, onForgotPassword, onCreateAccount } = props

  const [role, setRole] = useState<SignInRole>('customer')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<SignInErrors>({})

  const [fieldsScope, animateFields] = useAnimate<HTMLDivElement>()
  const reduceMotion = useReducedMotion()

  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()

    const values = { role, email: email.trim(), password }
    const nextErrors = validateSignIn(values)
    setErrors(nextErrors)

    // Um tremor curto nos campos reforça o erro; a mensagem escrita continua sendo o canal principal.
    if ((nextErrors.email || nextErrors.password) && !reduceMotion) {
      void animateFields(fieldsScope.current, { x: [0, -8, 8, -5, 5, 0] }, { duration: 0.4 })
    }

    // O foco vai para o primeiro campo com erro, e o leitor de tela lê a mensagem ligada a ele.
    if (nextErrors.email) emailRef.current?.focus()
    else if (nextErrors.password) passwordRef.current?.focus()
    else onSubmit?.(values)
  }

  const forgotPassword = (
    <button type="button" onClick={onForgotPassword} className={LINK_CLASSES}>
      Esqueci minha senha
    </button>
  )

  return (
    // Quem pediu menos movimento no sistema vê tudo aparecer sem deslocamento nem zoom.
    <MotionConfig reducedMotion="user">
      <main className="min-h-dvh bg-(--bg-surface) lg:flex">
        <HeroPanel />

        <div className="px-(--space-16) pt-(--space-24) pb-[calc(var(--space-16)+env(safe-area-inset-bottom))] lg:flex lg:min-w-0 lg:flex-1 lg:items-center lg:justify-center lg:p-(--space-40)">
          <motion.div
            variants={stagger(0.2)}
            initial="hidden"
            animate="show"
            className="mx-auto flex w-full max-w-md flex-col gap-(--space-16) lg:max-w-95.25"
          >
            <motion.div variants={fadeUp} className="hidden self-start lg:block">
              <Logotype className="h-11.75" alt="" />
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-col gap-(--space-4)">
              <h1 className="type-title text-(--text-strong) lg:text-(length:--size-display)! lg:leading-(--line-height-display)!">
                Bem-vindo de volta!
              </h1>
              {/* Troca junto com o seletor: o texto antigo sai por cima e o novo entra por baixo. */}
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={role}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: EASE_OUT }}
                  className="type-body text-(--text-muted)"
                >
                  {ROLE_SUBTITLES[role]}
                </motion.p>
              </AnimatePresence>
            </motion.div>

            <motion.div variants={fadeUp}>
              <SegmentedControl
                label="Tipo de conta"
                options={ROLE_OPTIONS}
                value={role}
                onValueChange={setRole}
              />
            </motion.div>

            <motion.form
              variants={fadeUp}
              noValidate
              onSubmit={handleSubmit}
              className="flex flex-col gap-(--space-16)"
            >
              <div ref={fieldsScope} className="flex flex-col gap-(--space-12)">
                <TextField
                  ref={emailRef}
                  id="sign-in-email"
                  label="E-mail"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="voce@exemplo.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    setErrors((current) => ({ ...current, email: undefined }))
                  }}
                  // No celular o Figma reserva a linha de ajuda vazia; o texto só aparece no desktop.
                  helper="Usamos para confirmar e avisar sobre o pedido."
                  helperClassName="invisible lg:visible"
                  error={errors.email}
                />
                <TextField
                  ref={passwordRef}
                  id="sign-in-password"
                  label="Senha"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setErrors((current) => ({ ...current, password: undefined }))
                  }}
                  helper={`Mínimo ${PASSWORD_MIN_LENGTH} caracteres.`}
                  helperClassName="invisible lg:visible"
                  error={errors.password}
                />
                <div className="hidden justify-end lg:flex">{forgotPassword}</div>
              </div>

              <div className="flex flex-col gap-(--space-16) lg:gap-(--space-12)">
                <Button type="submit" size="lg" className="w-full">
                  Entrar
                </Button>
                <p className="type-label flex justify-center gap-(--space-4) text-(--text-muted)">
                  Não tem conta?
                  <button type="button" onClick={onCreateAccount} className={LINK_CLASSES}>
                    Criar conta
                  </button>
                </p>
              </div>
            </motion.form>

            <motion.div variants={fadeUp} className="flex justify-center lg:hidden">
              {forgotPassword}
            </motion.div>

            <motion.p
              variants={fadeUp}
              className="type-caption hidden text-center text-(--text-muted) lg:block"
            >
              Ao continuar, você concorda com os Termos de Uso e a Política de Privacidade.
            </motion.p>
          </motion.div>
        </div>
      </main>
    </MotionConfig>
  )
}
