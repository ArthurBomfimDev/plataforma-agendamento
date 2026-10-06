using Booking.Domain.Entity.Module.Identity;
using Booking.Domain.Enum.Module.Identity;

namespace Booking.Domain.Interface.Repository.Module.Identity;

public interface IUserTokenRepository
{
    Task<UserToken?> GetByHashAsync(UserTokenType type, string tokenHash, CancellationToken ct = default);
    void Add(UserToken token);

<<<<<<< HEAD
=======
    /// <summary>Invalida os tokens pendentes do mesmo tipo, para que só o último e-mail enviado valha.</summary>
>>>>>>> 072927b623995e9cdf1f2a39df62404aca1719cf
    Task InvalidatePendingAsync(Guid userId, UserTokenType type, DateTimeOffset now, CancellationToken ct = default);
}
