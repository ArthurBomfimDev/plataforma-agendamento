using Booking.Domain.Entity.Module.Identity;
using Booking.Domain.Interface.Repository.Module.Identity;
using Booking.Infrastructure.Persistence.Context;
using Booking.Infrastructure.Persistence.Mapping.Base;
using Microsoft.EntityFrameworkCore;

namespace Booking.Infrastructure.Module.Identity.Repository;

public sealed class RefreshTokenRepository(BookingDbContext context) : IRefreshTokenRepository
{
    public Task<RefreshToken?> GetByHashAsync(string tokenHash, CancellationToken ct = default) =>
        context.Set<RefreshToken>().FirstOrDefaultAsync(x => x.TokenHash == tokenHash, ct);

    public void Add(RefreshToken token) => context.Set<RefreshToken>().Add(token);

    public Task RevokeAllActiveAsync(Guid userId, DateTimeOffset now, CancellationToken ct = default) =>
        context.Set<RefreshToken>()
            .Where(x => x.UserId == userId && x.RevokedAt == null && x.ExpiresAt > now)
            .ExecuteUpdateAsync(
                s => s
                    .SetProperty(x => x.RevokedAt, now)
                    .SetProperty(x => EF.Property<DateTimeOffset?>(x, AuditColumns.UpdateAt), now),
                ct);
}
