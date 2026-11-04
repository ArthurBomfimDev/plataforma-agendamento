import { ApiError } from './errors'
import { QueryClient } from '@tanstack/react-query'

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // Vitrine muda pouco; horário livre muda — as consultas de disponibilidade se refazem ao
        // voltar para a tela e a cada pedido enviado (ver `invalidateQueries` em queries.ts).
        staleTime: 30_000,
        // Erro 4xx não melhora repetindo; só falha de rede e 5xx tentam de novo.
        retry: (failureCount, error) =>
          failureCount < 2 &&
          !(error instanceof ApiError && error.status >= 400 && error.status < 500),
      },
    },
  })
