using Booking.Domain.Entity.Module.Identity;
using Booking.Domain.Enum.Module.Identity;
using Booking.Domain.Interface.Repository.Module.Identity;
using Booking.Infrastructure.Persistence.Context;
using Booking.Infrastructure.Persistence.Mapping.Base;
using Microsoft.EntityFrameworkCore;

namespace Booking.Infrastructure.Module.Identity.Repository;

public sealed class UserTokenRepository(BookingDbContext context) : IUserTokenRepository
{
    public Task<UserToken?> GetByHashAsync(UserTokenType type, string tokenHash, CancellationToken ct = default) =>
        context.Set<UserToken>().FirstOrDefaultAsync(x => x.Type == type && x.TokenHash == tokenHash, ct);

    public void Add(UserToken token) => context.Set<UserToken>().Add(token);

    public Task InvalidatePendingAsync(Guid userId, UserTokenType type, DateTimeOffset now, CancellationToken ct = default) =>
        context.Set<UserToken>()
            .Where(x => x.UserId == userId && x.Type == type && x.UsedAt == null && x.ExpiresAt > now)
            .ExecuteUpdateAsync(
                s => s
                    .SetProperty(x => x.UsedAt, now)
                    .SetProperty(x => EF.Property<DateTimeOffset?>(x, AuditColumns.UpdateAt), now),
                ct);
}
