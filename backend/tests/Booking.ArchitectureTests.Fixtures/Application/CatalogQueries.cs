using Booking.Domain.Base;
using Booking.Domain.Module.Catalog;

namespace Booking.Application.Module.Catalog.Queries;

public interface IServiceListing
{
    /// <summary>✗ Decisão 4 — coleção sem limite.</summary>
    Task<IReadOnlyList<Category>> ListAll(CancellationToken cancellationToken);

    /// <summary>✓ Decisão 4.</summary>
    Task<PagedResult<Category>> List(PageRequest page, CancellationToken cancellationToken);
}
