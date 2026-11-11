using Booking.Domain.Entity.Base;
using Booking.Domain.Entity.Module.Catalog.Planted;

namespace Booking.Application.Module.Catalog.Queries;

public interface IServiceListing
{
    /// <summary>✗ Decisão 4 — coleção sem limite.</summary>
    Task<IReadOnlyList<Service>> ListAll(CancellationToken cancellationToken);

    /// <summary>✓ Decisão 4.</summary>
    Task<PagedResult<Service>> List(PageRequest page, CancellationToken cancellationToken);
}
