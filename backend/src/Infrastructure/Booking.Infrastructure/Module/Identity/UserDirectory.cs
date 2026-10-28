using Booking.Application.Contracts.Identity;
using Booking.Domain.Entity.Module.Identity;
using Booking.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace Booking.Infrastructure.Module.Identity;

public sealed class UserDirectory(BookingDbContext context) : IUserDirectory
{
    public async Task<IReadOnlyDictionary<Guid, string>> GetFullNamesAsync(IReadOnlyCollection<Guid> userIds, CancellationToken ct = default) =>
        userIds.Count == 0
            ? new Dictionary<Guid, string>()
            : await context.Set<User>().AsNoTracking()
                .Where(x => userIds.Contains(x.Id))
                .ToDictionaryAsync(x => x.Id, x => x.FullName, ct);
}
