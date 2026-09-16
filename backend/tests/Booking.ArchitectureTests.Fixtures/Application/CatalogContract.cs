namespace Booking.Application.Contracts.Catalog;

/// <summary>Superfície pública do Catalog — o único jeito permitido de outro módulo consultá-lo.</summary>
public interface IServiceCatalog
{
    Task<int?> GetDurationMinutes(Guid serviceId, CancellationToken cancellationToken);
}
