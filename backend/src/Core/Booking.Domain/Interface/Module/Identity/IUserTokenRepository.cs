using Booking.Domain.Entity.Module.Identity;
using Booking.Domain.Enum.Module.Identity;

namespace Booking.Domain.Interface.Repository.Module.Identity;

public interface IUserTokenRepository
{
    Task<UserToken?> GetByHashAsync(UserTokenType type, string tokenHash, CancellationToken ct = default);
    void Add(UserToken token);

    /// <summary>Invalida os tokens pendentes do mesmo tipo, para que só o último e-mail enviado valha.</summary>
    Task InvalidatePendingAsync(Guid userId, UserTokenType type, DateTimeOffset now, CancellationToken ct = default);

    /// <summary>Quando foi emitido o token mais recente do tipo, usado ou não; nulo se nunca houve.</summary>
    Task<DateTimeOffset?> LatestIssuedAtAsync(Guid userId, UserTokenType type, CancellationToken ct = default);
}
