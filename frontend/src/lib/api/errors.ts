/**
 * Erro vindo da API. `code` é o código estável do ProblemDetails (`auth.invalid_credentials`,
 * `customer.profile_required`…); é ele que decide a mensagem, nunca o texto do servidor.
 */
export class ApiError extends Error {
  readonly status: number
  readonly code: string | undefined

  constructor(status: number, code: string | undefined, message?: string) {
    super(message ?? code ?? `HTTP ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

/** Mensagens para o consumidor, por código. O que não está aqui cai na mensagem genérica. */
const MESSAGES: Record<string, string> = {
  'auth.invalid_credentials': 'E-mail ou senha incorretos.',
  'auth.account_not_active': 'Esta conta não está ativa.',
  'identity.email_not_confirmed':
    'Confirme seu e-mail para entrar. Enviamos o link quando você criou a conta.',
  'user_token.invalid': 'Este link expirou ou já foi usado.',
  'auth.unauthenticated': 'Entre na sua conta para continuar.',
  'user.email_already_registered': 'Já existe uma conta com este e-mail.',
  'user.password_invalid_length': 'A senha precisa ter entre 8 e 128 caracteres.',
  'email.invalid_format': 'Informe um e-mail válido.',
  'customer.profile_required': 'Complete seu cadastro de consumidor para agendar.',
  'compliance.consent_required':
    'Este estabelecimento é da área da saúde: é preciso dar o consentimento antes de agendar.',
  'business.not_found': 'Estabelecimento não encontrado.',
  'service.not_found': 'Serviço não encontrado.',
  'appointment.not_found': 'Agendamento não encontrado.',
  'auth.forbidden': 'Você não tem permissão para fazer isso neste estabelecimento.',
  'tenant.missing': 'Escolha um estabelecimento para abrir o painel.',
  'appointment.customer_context_required':
    'No painel do estabelecimento não dá para agendar. Troque para consumidor.',
  'appointment.cannot_book_own_business':
    'Você não pode agendar no seu próprio estabelecimento. Use a marcação de balcão no painel.',
  'appointment.cannot_confirm_from_current_status':
    'Este pedido já foi respondido. A lista foi atualizada.',
  'appointment.cannot_confirm_expired': 'O prazo deste pedido acabou e ele expirou.',
  'appointment.cannot_reject_from_current_status':
    'Este pedido já foi respondido. A lista foi atualizada.',
  'appointment.cannot_cancel_from_current_status': 'Este agendamento não pode mais ser cancelado.',
  'appointment.cannot_cancel_inside_window': 'O prazo para cancelar este agendamento já passou.',
  'appointment.cannot_complete_from_current_status':
    'Só dá para concluir um agendamento confirmado, depois do horário dele.',
  'appointment.cannot_mark_no_show_from_current_status':
    'Só dá para marcar falta num agendamento confirmado, depois do horário dele.',
  'appointment.walk_in_name_required': 'Informe o nome de quem vai ser atendido.',
  'image.unsupported_type': 'Envie uma imagem JPEG, PNG ou WebP.',
  'image.too_large': 'A imagem passa de 5 MB. Escolha uma menor.',
  'image.dimensions_too_large': 'A imagem é grande demais (mais de 6000 px de lado).',
  'image.unreadable': 'Não conseguimos ler essa imagem. Tente outro arquivo.',
  'image.empty': 'Escolha uma imagem para enviar.',
  'geo.postal_code_invalid': 'Informe um CEP com 8 dígitos.',
  'postal_code.not_found': 'Não encontramos esse CEP.',
  'geo.query_invalid': 'Digite pelo menos 3 letras.',
  'place.not_found': 'Não reconhecemos esse lugar.',
  'geo.provider_unavailable':
    'A busca de endereço está fora do ar agora. Tente de novo em instantes ou escolha outro jeito.',
}

/** Mensagem pronta para toast ou formulário. */
export const errorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    if (error.code && MESSAGES[error.code]) return MESSAGES[error.code]!
    if (error.status === 0) return 'Sem conexão com o servidor. Tente de novo.'
    if (error.status === 429) return 'Muitas tentativas. Aguarde um minuto e tente de novo.'
    if (error.status === 413) return 'A imagem passa de 5 MB. Escolha uma menor.'
    if (error.status === 409) return 'Esse horário acabou de ser ocupado. Escolha outro.'
    if (error.status === 403) return 'Você não tem permissão para fazer isso.'
    if (error.status === 404) return 'Não encontramos o que você procurava. A lista foi atualizada.'
  }
  return 'Algo deu errado. Tente de novo.'
}

/** Recurso inexistente ou não público: a tela mostra "não encontrado", não "erro". */
export const isNotFound = (error: unknown) =>
  error instanceof ApiError && (error.status === 404 || Boolean(error.code?.endsWith('.not_found')))
