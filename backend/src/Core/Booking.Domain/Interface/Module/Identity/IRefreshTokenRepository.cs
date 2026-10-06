using Booking.Domain.Entity.Module.Identity;

namespace Booking.Domain.Interface.Repository.Module.Identity;

public interface IRefreshTokenRepository
{
    Task<RefreshToken?> GetByHashAsync(string tokenHash, CancellationToken ct = default);
    void Add(RefreshToken token);

    Task RevokeAllActiveAsync(Guid userId, DateTimeOffset now, CancellationToken ct = default);
}
