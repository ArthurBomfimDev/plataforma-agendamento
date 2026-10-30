using Booking.Domain.Entity.Base;
using Booking.Domain.Exceptions;

namespace Booking.Domain.Entity.Module.Identity;

public sealed class RefreshToken : BaseEntity, IAuditable
{
    public Guid UserId { get; private set; }
    public string TokenHash { get; private set; } = null!;
    public DateTimeOffset ExpiresAt { get; private set; }
    public DateTimeOffset? RevokedAt { get; private set; }
    public string? ReplacedByTokenHash { get; private set; }

    private RefreshToken()
    {
    }

    public static RefreshToken Issue(Guid userId, string tokenHash, DateTimeOffset expiresAt)
    {
        if (string.IsNullOrWhiteSpace(tokenHash))
        {
            throw new DomainException("refresh_token.hash_required");
        }

        return new RefreshToken
        {
            UserId = userId,
            TokenHash = tokenHash,
            ExpiresAt = expiresAt,
        };
    }

    public bool IsActive(DateTimeOffset now) => RevokedAt is null && ExpiresAt > now;

    public void Revoke(DateTimeOffset now, string? replacedByTokenHash = null)
    {
        if (RevokedAt is not null)
        {
            throw new DomainException("refresh_token.already_revoked");
        }

        RevokedAt = now;
        ReplacedByTokenHash = replacedByTokenHash;
    }
}
