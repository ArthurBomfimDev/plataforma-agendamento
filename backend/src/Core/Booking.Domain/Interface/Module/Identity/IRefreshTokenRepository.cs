using Booking.Domain.Entity.Module.Identity;

namespace Booking.Domain.Interface.Repository.Module.Identity;

public interface IRefreshTokenRepository
{
    Task<RefreshToken?> GetByHashAsync(string tokenHash, CancellationToken ct = default);
    void Add(RefreshToken token);

<<<<<<< HEAD
=======
    /// <summary>Revoga todas as sessões ativas do usuário. Usado ao detectar reuso de refresh token e ao trocar a senha.</summary>
>>>>>>> 072927b623995e9cdf1f2a39df62404aca1719cf
    Task RevokeAllActiveAsync(Guid userId, DateTimeOffset now, CancellationToken ct = default);
}
