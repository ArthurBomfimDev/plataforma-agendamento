using Booking.Domain.Entity.Base;
using Booking.Domain.Entity.Module.Tenancy;
using Booking.Domain.Enum.Module.Tenancy;

namespace Booking.Domain.Interface.Repository.Module.Tenancy;

public interface IBusinessReportRepository
{
    Task<BusinessReport?> GetByIdAsync(Guid id, CancellationToken ct = default);

    /// <summary>Fila do Admin: as denúncias no estado pedido, as mais antigas primeiro.</summary>
    Task<PagedResult<BusinessReport>> ListByStatusAsync(BusinessReportStatus status, PageRequest page, CancellationToken ct = default);

    void Add(BusinessReport report);
}
