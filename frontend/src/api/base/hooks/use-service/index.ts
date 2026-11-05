import type { UseServiceMutationOptions, UseServiceOptions } from './types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { QueryKey } from '@tanstack/react-query'

/**
 * Consulta a um serviço de `api/services`, sobre o `useQuery`: cache, loading, erro e nova tentativa ficam com o
 * TanStack Query. O que soma é o sinal de cancelamento chegar ao Axios.
 */
export const useService = <TData, TSelected = TData, TKey extends QueryKey = QueryKey>({
  service,
  ...options
}: UseServiceOptions<TData, TSelected, TKey>) =>
  useQuery({ ...options, queryFn: ({ signal }) => service(signal) })

/** Escrita num serviço, sobre o `useMutation`, já com a invalidação do cache que ela afeta. */
export const useServiceMutation = <TVariables = void, TData = unknown>({
  service,
  invalidates = [],
  invalidateOn = 'success',
  onSuccess,
  onSettled,
  ...options
}: UseServiceMutationOptions<TVariables, TData>) => {
  const queryClient = useQueryClient()
  const invalidate = () =>
    Promise.all(invalidates.map((queryKey) => queryClient.invalidateQueries({ queryKey })))

  return useMutation({
    ...options,
    mutationFn: service,
    onSuccess: (...args) => {
      if (invalidateOn === 'success') void invalidate()
      return onSuccess?.(...args)
    },
    onSettled: async (...args) => {
      if (invalidateOn === 'settled') await invalidate()
      return onSettled?.(...args)
    },
  })
}
