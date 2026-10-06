using Booking.Application.Common.Persistence;
using Booking.Application.Contracts.Identity;
using Booking.Arguments.Module.Identity;
using Booking.Domain.Entity.Module.Identity;
using Booking.Domain.Interface.Repository.Module.Identity;

namespace Booking.Application.Module.Identity.Commands;

public sealed class LogoutCommand(
    IRefreshTokenRepository refreshTokens,
    ISecureTokenGenerator tokens,
    IUnitOfWork unitOfWork,
    TimeProvider clock)
{
<<<<<<< HEAD
=======
    /// <summary>Idempotente: token desconhecido ou já revogado não é erro, o resultado final é o mesmo.</summary>
>>>>>>> 072927b623995e9cdf1f2a39df62404aca1719cf
    public async Task ExecuteAsync(LogoutRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            return;
        }

        RefreshToken? token = await refreshTokens.GetByHashAsync(tokens.Hash(request.RefreshToken), ct);

        if (token is null || token.RevokedAt is not null)
        {
            return;
        }

        token.Revoke(clock.GetUtcNow());
        await unitOfWork.SaveChangesAsync(ct);
    }
}
