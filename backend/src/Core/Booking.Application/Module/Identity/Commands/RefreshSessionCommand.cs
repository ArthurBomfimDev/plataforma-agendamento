using Booking.Application.Common.Persistence;
using Booking.Application.Contracts.Identity;
using Booking.Arguments.Module.Identity;
using Booking.Domain.Entity.Module.Identity;
using Booking.Domain.Enum.Module.Identity;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.Identity;

namespace Booking.Application.Module.Identity.Commands;

/// <summary>
/// Rotação de refresh token: cada token vale uma vez. Apresentar um token já revogado indica
/// roubo ou cópia, e derruba todas as sessões do usuário.
/// </summary>
public sealed class RefreshSessionCommand(
    IRefreshTokenRepository refreshTokens,
    IUserRepository users,
    ISecureTokenGenerator tokens,
    IAccessTokenIssuer accessTokens,
    IUnitOfWork unitOfWork,
    TimeProvider clock,
    IdentityPolicy policy)
{
    public async Task<AuthResponse> ExecuteAsync(RefreshSessionRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            throw new DomainException("auth.invalid_refresh_token");
        }

        DateTimeOffset now = clock.GetUtcNow();
        RefreshToken? current = await refreshTokens.GetByHashAsync(tokens.Hash(request.RefreshToken), ct);

        if (current is null)
        {
            throw new DomainException("auth.invalid_refresh_token");
        }

        if (current.RevokedAt is not null)
        {
            await refreshTokens.RevokeAllActiveAsync(current.UserId, now, ct);
            await unitOfWork.SaveChangesAsync(ct);
            throw new DomainException("auth.refresh_token_reused");
        }

        User? user = await users.GetByIdAsync(current.UserId, ct);

        if (!current.IsActive(now) || user is null || user.Status != UserStatus.Active)
        {
            throw new DomainException("auth.invalid_refresh_token");
        }

        GeneratedToken next = tokens.Generate();
        current.Revoke(now, next.Hash);
        refreshTokens.Add(RefreshToken.Issue(user.Id, next.Hash, now + policy.RefreshTokenLifetime));

        AccessToken access = accessTokens.Issue(user, now);
        await unitOfWork.SaveChangesAsync(ct);

        return new AuthResponse(access.Value, access.ExpiresAt, next.Raw);
    }
}
