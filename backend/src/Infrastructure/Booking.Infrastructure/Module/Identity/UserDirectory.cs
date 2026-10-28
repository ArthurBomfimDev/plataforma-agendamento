using Booking.Application.Contracts.Identity;
using Booking.Domain.Entity.Module.Identity;
using Booking.Domain.Enum.Module.Identity;
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

    public async Task<IReadOnlyList<UserContact>> GetActiveContactsAsync(IReadOnlyCollection<Guid> userIds, CancellationToken ct = default)
    {
        if (userIds.Count == 0)
        {
            return [];
        }

        List<User> active = await context.Set<User>().AsNoTracking()
            .Where(x => userIds.Contains(x.Id) && x.Status == UserStatus.Active)
            .ToListAsync(ct);

        return [.. active.Select(x => new UserContact(x.Id, x.Email.Address, x.FullName))];
    }
}
