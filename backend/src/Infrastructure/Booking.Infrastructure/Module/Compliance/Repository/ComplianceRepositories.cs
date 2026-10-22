using Booking.Domain.Entity.Base;
using Booking.Domain.Entity.Module.Compliance;
using Booking.Domain.Enum.Module.Compliance;
using Booking.Domain.Interface.Repository.Module.Compliance;
using Booking.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace Booking.Infrastructure.Module.Compliance.Repository;

public sealed class ConsentRecordRepository(BookingDbContext context) : IConsentRecordRepository
{
    public async Task<IReadOnlyList<ConsentRecord>> ListActiveAsync(Guid userId, ConsentPurpose purpose, CancellationToken ct = default) =>
        await context.Set<ConsentRecord>()
            .Where(x => x.UserId == userId && x.Purpose == purpose && x.RevokedAt == null)
            .ToListAsync(ct);

    public Task<PagedResult<ConsentRecord>> ListForUserAsync(Guid userId, PageRequest page, CancellationToken ct = default) =>
        context.Set<ConsentRecord>().AsNoTracking()
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.GrantedAt)
            .ToPagedAsync(page, ct);

    public void Add(ConsentRecord record) => context.Set<ConsentRecord>().Add(record);
}

public sealed class SensitiveAccessLogRepository(BookingDbContext context) : ISensitiveAccessLogRepository
{
    public void Add(SensitiveAccessLog entry) => context.Set<SensitiveAccessLog>().Add(entry);
}
