import { SignInScreen } from '../features/sign-in'
import { toast } from '../lib/toast'

/**
 * TODO: entrar de verdade depende da autenticação (módulo Identity), que ainda não existe e exige
 * revisão humana (CLAUDE.md §4). Por enquanto a tela valida o formulário e avisa. "Criar conta" e
 * "Esqueci minha senha" são as telas A02 e A05, ainda não implementadas.
 */
export const SignInRoute = () => {
  return (
    <SignInScreen
      onSubmit={() => toast.info('Entrar ainda não está disponível.')}
      onCreateAccount={() => toast.info('Criar conta ainda não está disponível.')}
      onForgotPassword={() => toast.info('Recuperar senha ainda não está disponível.')}
    />
  )
}
