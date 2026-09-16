namespace Booking.Domain.Base;

/// <summary>
/// Única forma permitida de devolver uma coleção a partir de repositório, serviço base ou consulta.
/// </summary>
/// <remarks>
/// Verificado por PaginationTests: método que devolve List, IEnumerable, array ou similar nessas
/// superfícies quebra o build. Sustenta o RNF-01 (busca com slots, p95 ≤ 800 ms).
/// </remarks>
public sealed record PagedResult<T>(IReadOnlyList<T> Items, int Page, int PageSize, long TotalCount);
