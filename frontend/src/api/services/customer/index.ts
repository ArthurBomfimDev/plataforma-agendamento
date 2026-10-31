import type { CustomerResponse } from '@api/models'
import { authRequest } from '@api/base'
import { customerEndpoints } from './endpoints'

export const customerService = {
  /** Cria o perfil de consumidor da conta (a data de nascimento vem do cadastro). */
  register: (birthDate: string) =>
    authRequest<CustomerResponse>({
      method: 'POST',
      url: customerEndpoints.me,
      data: { birthDate, socialName: null },
    }),
}
