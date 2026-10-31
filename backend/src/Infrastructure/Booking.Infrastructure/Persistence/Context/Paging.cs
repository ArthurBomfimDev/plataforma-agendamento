using Booking.Domain.Entity.Base;
using Microsoft.EntityFrameworkCore;

namespace Booking.Infrastructure.Persistence.Context;

/// <summary>Paginação única (ADR-010, decisão 4): página mínima 1, tamanho entre 1 e 100.</summary>
internal static class Paging
{
    public const int MaxPageSize = 100;

    public static async Task<PagedResult<T>> ToPagedAsync<T>(this IQueryable<T> query, PageRequest request, CancellationToken ct)
    {
        int page = Math.Max(1, request.Page);
        int pageSize = Math.Clamp(request.PageSize, 1, MaxPageSize);

        long total = await query.LongCountAsync(ct);
        List<T> items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);

        return new PagedResult<T>(items, page, pageSize, total);
    }
}
