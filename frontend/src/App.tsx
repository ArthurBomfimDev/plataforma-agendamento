import { CardEstablishment } from './components/CardEstablishment'

/**
 * Tela provisória. Existe só para o build e o dev server terem o que renderizar enquanto
 * o esqueleto do frontend não é montado. Usa tokens semânticos, nunca valor fixo.
 */
export default function App() {
  return (
    <main
      style={{
        background: 'var(--bg-page)',
        color: 'var(--text-body)',
        fontFamily: 'var(--family-sans)',
        minHeight: '100dvh',
        padding: 'var(--space-24)',
      }}
    >
      <h1
        style={{
          color: 'var(--text-strong)',
          fontSize: 'var(--size-heading)',
          lineHeight: 'var(--line-height-heading)',
        }}
      >
        Plataforma de agendamento
      </h1>
      <CardEstablishment />
      <p>Esqueleto do frontend. Nenhuma tela implementada ainda.</p>
    </main>
  )
}
