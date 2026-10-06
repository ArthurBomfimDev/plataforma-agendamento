using Booking.Application.Contracts.Identity;
using Booking.Domain.Entity.Module.Identity;
using Booking.Domain.Enum.Module.Identity;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.Identity;

namespace Booking.Application.Module.Identity.Commands;

internal static class UserTokenLookup
{
<<<<<<< HEAD
=======
    /// <summary>Token inexistente, usado ou expirado viram o mesmo erro: não revela qual foi o caso.</summary>
>>>>>>> 072927b623995e9cdf1f2a39df62404aca1719cf
    public static async Task<UserToken> RequireValidAsync(
        IUserTokenRepository repository,
        ISecureTokenGenerator tokens,
        UserTokenType type,
        string? rawToken,
        DateTimeOffset now,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(rawToken))
        {
            throw new DomainException("user_token.invalid");
        }

        UserToken? token = await repository.GetByHashAsync(type, tokens.Hash(rawToken), ct);

        if (token is null || !token.IsValid(now))
        {
            throw new DomainException("user_token.invalid");
        }

        return token;
    }
}
