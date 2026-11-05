using Booking.Domain.Entity.Base;
using Booking.Domain.Entity.Module.Tenancy;
using Booking.Domain.Enum.Module.Tenancy;
using Booking.Domain.Interface.Repository.Module.Tenancy;
using Booking.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace Booking.Infrastructure.Module.Tenancy.Repository;

public sealed class BusinessReportRepository(BookingDbContext context) : IBusinessReportRepository
{
    public Task<BusinessReport?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        context.Set<BusinessReport>().FirstOrDefaultAsync(x => x.Id == id, ct);

    // Ordem por id: o Guid v7 cresce com o tempo, então a mais antiga aparece primeiro.
    public Task<PagedResult<BusinessReport>> ListByStatusAsync(BusinessReportStatus status, PageRequest page, CancellationToken ct = default) =>
        context.Set<BusinessReport>().AsNoTracking()
            .Where(x => x.Status == status)
            .OrderBy(x => x.Id)
            .ToPagedAsync(page, ct);

    public void Add(BusinessReport report) => context.Set<BusinessReport>().Add(report);
}
