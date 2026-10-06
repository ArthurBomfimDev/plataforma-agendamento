using Booking.Domain.Entity.Module.Identity;
using Booking.Domain.Enum.Module.Identity;

namespace Booking.Domain.Interface.Repository.Module.Identity;

public interface IUserTokenRepository
{
    Task<UserToken?> GetByHashAsync(UserTokenType type, string tokenHash, CancellationToken ct = default);
    void Add(UserToken token);

    Task InvalidatePendingAsync(Guid userId, UserTokenType type, DateTimeOffset now, CancellationToken ct = default);
}
