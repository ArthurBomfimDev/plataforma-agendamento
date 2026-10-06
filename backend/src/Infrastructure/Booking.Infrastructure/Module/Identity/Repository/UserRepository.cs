using Booking.Domain.Entity.Module.Identity;
using Booking.Domain.Interface.Repository.Module.Identity;
using Booking.Domain.ValueObject;
using Booking.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace Booking.Infrastructure.Module.Identity.Repository;

public sealed class UserRepository(BookingDbContext context) : IUserRepository
{
    public Task<User?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        context.Set<User>().FirstOrDefaultAsync(x => x.Id == id, ct);

    public Task<User?> GetByEmailAsync(Email email, CancellationToken ct = default) =>
        context.Set<User>().FirstOrDefaultAsync(x => x.Email == email, ct);

    public Task<bool> ExistsByEmailAsync(Email email, CancellationToken ct = default) =>
        context.Set<User>().AnyAsync(x => x.Email == email, ct);

    public void Add(User user) => context.Set<User>().Add(user);
}
