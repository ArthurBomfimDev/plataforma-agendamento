/**
 * Sem papel marcado de início: com "Profissional" pré-selecionado, quem ia ser atendente virava profissional sem perceber,
 * com agenda vazia e perfil público (teste de 05/11).
 */
export const NO_ROLE = ''

export const ROLE_OPTIONS = [
  { value: NO_ROLE, label: 'Escolha o papel' },
  { value: 'Professional', label: 'Profissional — atende e tem agenda própria' },
  {
    value: 'Attendant',
    label: 'Atendente — opera a agenda de todos, sem editar o estabelecimento',
  },
]
