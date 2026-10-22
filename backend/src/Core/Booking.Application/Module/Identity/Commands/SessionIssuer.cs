using Booking.Application.Contracts.Identity;
using Booking.Arguments.Module.Identity;
using Booking.Domain.Entity.Module.Identity;
using Booking.Domain.Interface.Repository.Module.Identity;

namespace Booking.Application.Module.Identity.Commands;

/// <summary>Abre uma sessão: access token (JWT) + refresh token opaco persistido só como hash.</summary>
public sealed class SessionIssuer(
    IAccessTokenIssuer accessTokens,
    ISecureTokenGenerator tokens,
    IRefreshTokenRepository refreshTokens,
    IdentityPolicy policy)
{
    public AuthResponse Open(User user, DateTimeOffset now)
    {
        AccessToken access = accessTokens.Issue(user, now);
        GeneratedToken refresh = tokens.Generate();

        refreshTokens.Add(RefreshToken.Issue(user.Id, refresh.Hash, now + policy.RefreshTokenLifetime));

        return new AuthResponse(access.Value, access.ExpiresAt, refresh.Raw);
    }
}
