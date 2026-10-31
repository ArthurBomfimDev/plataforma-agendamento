import type { QueryKey, UseMutationOptions, UseQueryOptions } from '@tanstack/react-query'

/** A chamada ao serviço. Recebe o sinal da consulta: sair da tela cancela a requisição. */
export type ServiceCall<TData> = (signal: AbortSignal) => Promise<TData>

export type UseServiceOptions<TData, TSelected, TKey extends QueryKey> = Omit<
  UseQueryOptions<TData, Error, TSelected, TKey>,
  'queryFn'
> & { service: ServiceCall<TData> }

export type UseServiceMutationOptions<TVariables, TData> = Omit<
  UseMutationOptions<TData, Error, TVariables>,
  'mutationFn'
> & {
  service: (variables: TVariables) => Promise<TData>
  /** Prefixos do cache buscados de novo depois da escrita. */
  invalidates?: QueryKey[]
  /**
   * `success` (padrão) só invalida no acerto, sem segurar a mutação. `settled` invalida também no erro — um 409
   * quer dizer que a tela está velha — e a mutação só termina com a lista já buscada de novo.
   */
  invalidateOn?: 'success' | 'settled'
}
