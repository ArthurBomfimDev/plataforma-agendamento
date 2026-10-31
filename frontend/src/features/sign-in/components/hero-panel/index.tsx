import { EASE_OUT, PILLARS, fadeUp, stagger } from '../../consts'

import { Logotype } from '@/components/logotype'
import heroImage from '../../../../global/images/vagoo-login.jpg'
import { motion } from 'framer-motion'

/**
 * Painel visual: foto, tom de marca e véu. No celular é a faixa do topo; no desktop, a esquerda.
 * Ocupa 979 de 1440px (68%), mas cede espaço para a coluna do formulário nunca ficar abaixo dos
 * 461px do Figma — em 1024px os 68% deixariam o seletor de conta transbordar.
 */
export const HeroPanel = () => (
  <section className="relative isolate min-h-65 overflow-hidden lg:min-h-dvh lg:w-[min(68%,calc(100%-461px))] lg:shrink-0">
    {/* A foto chega levemente ampliada e recua devagar: profundidade sem disputar com o texto. */}
    <motion.img
      src={heroImage}
      alt=""
      initial={{ scale: 1.08 }}
      animate={{ scale: 1 }}
      transition={{ duration: 1.6, ease: EASE_OUT }}
      className="absolute inset-0 -z-10 size-full object-cover"
    />
    {/* As duas camadas do Figma: "Tom de marca" (blend color) e "Scrim". */}
    <div className="absolute inset-0 -z-10 bg-(--primitive-primary-500) opacity-45 mix-blend-color" />
    <div className="absolute inset-0 -z-10 bg-(--bg-scrim) opacity-48" />

    <motion.div
      variants={stagger(0.1)}
      initial="hidden"
      animate="show"
      className="flex flex-col items-start gap-(--space-12) px-(--space-24) pt-[calc(71px+env(safe-area-inset-top))] pb-(--space-24) text-(--text-on-inverse) lg:gap-(--space-16) lg:px-18 lg:pt-24"
    >
      <motion.div variants={fadeUp} className="lg:mb-(--space-8)">
        <Logotype tone="dark" className="h-10.5 lg:h-12.75" />
      </motion.div>
      <motion.p
        variants={fadeUp}
        className="type-caption max-w-140 font-semibold! lg:text-(length:--size-hero)! lg:leading-(--line-height-hero)!"
      >
        Tudo que você precisa,
        <br />
        <span className="text-(--text-on-inverse-accent)">agendado</span> em um só lugar.
      </motion.p>
      <motion.p
        variants={fadeUp}
        className="type-caption max-w-120 opacity-80 lg:text-(length:--size-body-lg)! lg:leading-(--line-height-body-lg)! lg:opacity-85"
      >
        <span className="lg:hidden">Você vê o horário livre antes de enviar.</span>
        <span className="hidden lg:inline">
          Encontre e agende serviços de forma simples, rápida e segura. Você vê o horário livre
          antes de enviar o pedido.
        </span>
      </motion.p>
      <motion.ul
        variants={stagger(0)}
        className="hidden w-full max-w-180 grid-cols-3 gap-(--space-24) lg:mt-(--space-24) lg:grid"
      >
        {PILLARS.map((pillar) => (
          <motion.li
            key={pillar.title}
            variants={fadeUp}
            className="type-caption flex items-center gap-(--space-12)"
          >
            {/* Decorativo: o título ao lado já diz a ação. Placa de vidro para o ícone ter peso. */}
            <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-(--text-on-inverse)/12 ring-1 ring-(--text-on-inverse)/20 backdrop-blur-sm">
              <pillar.icon
                aria-hidden
                className="size-6 text-(--text-on-inverse-accent)"
                strokeWidth={2}
              />
            </span>
            <span className="flex flex-col">
              <span className="type-label font-semibold!">{pillar.title}</span>
              <span className="opacity-75">{pillar.description}</span>
            </span>
          </motion.li>
        ))}
      </motion.ul>
    </motion.div>

    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.6 }}
      transition={{ duration: 0.8, delay: 0.7 }}
      className="type-caption absolute bottom-18 left-18 hidden font-medium! tracking-[2px] whitespace-pre text-(--text-on-inverse) lg:block"
    >
      {'SERVIÇOS  ·  PROFISSIONAIS  ·  HORÁRIOS REAIS  ·  EM UM SÓ LUGAR'}
    </motion.p>
  </section>
)
