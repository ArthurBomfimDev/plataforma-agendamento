using Booking.Domain.Entity.Module.Identity;
using Booking.Domain.ValueObject;

namespace Booking.Domain.Interface.Repository.Module.Identity;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<User?> GetByEmailAsync(Email email, CancellationToken ct = default);
    Task<bool> ExistsByEmailAsync(Email email, CancellationToken ct = default);
    void Add(User user);
}
