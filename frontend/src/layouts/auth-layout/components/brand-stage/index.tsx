import { AGENDA_VERTICALS } from '@components/agenda-rail/consts'
import { AUTO_ADVANCE_MS, HEADLINE, PILL_SPRING } from './consts'
import { REDUCED_MOTION_QUERY, useMediaQuery } from '@hooks/use-media-query'
import { fadeUp, stagger } from '@pages/auth/sign-in/screen/consts'
import { useEffect, useState } from 'react'

import { AgendaRail } from '@components/agenda-rail'
import { Logotype } from '@components/logotype'
import { Tabs } from '@base-ui/react/tabs'
import { motion } from 'framer-motion'

const indexOf = (id: string) => AGENDA_VERTICALS.findIndex((vertical) => vertical.id === id)

const nextVertical = (id: string) =>
  AGENDA_VERTICALS[(indexOf(id) + 1) % AGENDA_VERTICALS.length]!.id

/**
 * Palco das telas de conta (Figma, A01): superfície de marca, que não inverte com o tema. O campo
 * visual é a própria agenda, e o carrossel troca o vertical para provar que ela serve para os três.
 *
 * Nada aqui é pré-requisito para entrar: quem usa leitor de tela recebe só as pílulas e um resumo.
 * Abaixo de 768px as pílulas somem, porque sem a trilha trocar de vertical não muda nada visível.
 */
export const BrandStage = () => {
  const [activeId, setActiveId] = useState(AGENDA_VERTICALS[0]!.id)
  const [direction, setDirection] = useState(1)
  const [hovering, setHovering] = useState(false)
  const [focused, setFocused] = useState(false)
  const reducedMotion = useMediaQuery(REDUCED_MOTION_QUERY)

  const autoAdvance = !hovering && !focused && !reducedMotion

  // Depende do vertical ativo: trocar pela pílula recomeça a contagem a partir dele.
  useEffect(() => {
    if (!autoAdvance) return undefined

    const timer = setTimeout(() => {
      setDirection(1)
      setActiveId(nextVertical(activeId))
    }, AUTO_ADVANCE_MS)
    return () => clearTimeout(timer)
  }, [autoAdvance, activeId])

  return (
    <motion.section
      variants={stagger(0.15)}
      initial="hidden"
      animate="show"
      className="relative isolate flex h-70 shrink-0 flex-col overflow-hidden bg-(--brand-ink) px-(--space-24) pt-[calc(56px+env(safe-area-inset-top))] md:h-auto md:gap-(--space-24) md:px-(--space-40) md:py-(--space-32) auth:h-full auth:min-w-0 auth:flex-1 auth:gap-0 auth:pt-11.5 auth:pr-0 auth:pb-(--space-40) auth:pl-(--space-64)"
    >
      {/* Os dois halos dão profundidade ao fundo; não são o assunto e não animam. */}
      <div
        aria-hidden="true"
        className="absolute -top-30 -left-32.5 -z-10 h-80 w-107.5 rounded-(--radius-full) bg-(--brand-glow-a) opacity-34 blur-[75px] auth:-top-75 auth:-left-30 auth:h-175 auth:w-225 auth:opacity-26 auth:blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="absolute top-15 left-35 -z-10 h-65 w-90 rounded-(--radius-full) bg-(--brand-glow-b) opacity-30 blur-[80px] auth:top-30 auth:left-45 auth:h-140 auth:w-180 auth:opacity-22 auth:blur-[120px]"
      />

      <div className="hidden md:block auth:hidden">
        <Logotype tone="dark" className="h-11.75" />
      </div>

      <motion.p
        variants={fadeUp}
        className="type-display max-w-135 leading-10! text-(--brand-on-ink) auth:max-w-[min(540px,100%-var(--space-64))] auth:text-(length:--size-hero)! auth:leading-(--line-height-hero)!"
      >
        {HEADLINE}
      </motion.p>
      <motion.p
        variants={fadeUp}
        className="type-body-lg mt-(--space-16) hidden max-w-[min(500px,100%-var(--space-64))] text-(--brand-on-ink-muted) auth:block [@media(max-height:800px)]:hidden"
      >
        Nada de “me chama no direct”. A disponibilidade sai da agenda de quem atende, no instante em
        que você olha.
      </motion.p>

      <Tabs.Root
        render={<motion.div variants={fadeUp} />}
        value={activeId}
        onValueChange={(value: string) => {
          setDirection(indexOf(value) > indexOf(activeId) ? 1 : -1)
          setActiveId(value)
        }}
        // Só o foco de teclado pausa: depois de um clique a pílula fica focada, e o carrossel pararia.
        onFocus={(event) => setFocused(event.target.matches(':focus-visible'))}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)
        }}
        className="hidden min-h-0 flex-col gap-(--space-12) md:flex auth:mt-auto auth:gap-9.5 auth:pt-(--space-24)"
      >
        <AgendaRail
          verticals={AGENDA_VERTICALS}
          activeId={activeId}
          direction={direction}
          className="hidden min-h-0 shrink auth:grid"
        />

        <Tabs.List
          aria-label="Exemplos de agenda por segmento"
          // O ponteiro pausa só sobre as pílulas: a trilha ocupa o palco quase todo e é decorativa.
          onPointerEnter={() => setHovering(true)}
          onPointerLeave={() => setHovering(false)}
          className="flex shrink-0 flex-wrap gap-(--space-8)"
        >
          {AGENDA_VERTICALS.map(({ id, name }) => (
            <Tabs.Tab
              key={id}
              value={id}
              // A pílula tem 42px, como no Figma; o `after` completa o alvo de toque de 44px.
              className="type-label relative flex h-10.5 items-center rounded-(--radius-full) border border-(--brand-line) bg-(--brand-card) px-3.75 whitespace-nowrap text-(--brand-on-ink-muted) transition-colors duration-200 after:absolute after:inset-x-0 after:-inset-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--brand-on-ink) data-active:text-(--brand-pill-text) motion-reduce:transition-none"
            >
              {id === activeId && (
                <motion.span
                  layoutId="active-vertical-pill"
                  transition={reducedMotion ? { duration: 0 } : PILL_SPRING}
                  className="absolute -inset-px rounded-(--radius-full) border border-(--brand-pill-line) bg-(--brand-pill-bg)"
                />
              )}
              <span className="relative">{name}</span>
              {/* O tempo até a próxima troca. Some na pausa: ao voltar, o timer e a barra recomeçam. */}
              {id === activeId && autoAdvance && (
                <motion.span
                  data-progress
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: AUTO_ADVANCE_MS / 1000, ease: 'linear' }}
                  style={{ originX: 0 }}
                  className="absolute inset-x-3.75 bottom-1 h-0.5 rounded-(--radius-full) bg-(--brand-accent)"
                />
              )}
            </Tabs.Tab>
          ))}
        </Tabs.List>

        {/* A trilha é `aria-hidden`: o painel de cada pílula é o resumo dela. Na faixa do tablet,
            sem a trilha, esse resumo fica visível para a pílula continuar mudando alguma coisa. */}
        {AGENDA_VERTICALS.map(({ id, business, freeToday }) => (
          <Tabs.Panel
            key={id}
            value={id}
            tabIndex={-1}
            className="type-caption text-(--brand-on-ink-muted) outline-none auth:sr-only"
          >
            {business} · {freeToday} horários livres hoje
          </Tabs.Panel>
        ))}
      </Tabs.Root>
    </motion.section>
  )
}
