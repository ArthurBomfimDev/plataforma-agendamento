using Booking.Domain.Entity.Module.Identity;

namespace Booking.Domain.Interface.Repository.Module.Identity;

public interface IRefreshTokenRepository
{
    Task<RefreshToken?> GetByHashAsync(string tokenHash, CancellationToken ct = default);
    void Add(RefreshToken token);

    /// <summary>Revoga todas as sessões ativas do usuário. Usado ao detectar reuso de refresh token e ao trocar a senha.</summary>
    Task RevokeAllActiveAsync(Guid userId, DateTimeOffset now, CancellationToken ct = default);
}
