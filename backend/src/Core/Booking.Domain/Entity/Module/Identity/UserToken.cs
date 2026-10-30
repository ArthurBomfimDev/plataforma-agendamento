using Booking.Domain.Entity.Base;
using Booking.Domain.Enum.Module.Identity;
using Booking.Domain.Exceptions;

namespace Booking.Domain.Entity.Module.Identity;

public sealed class UserToken : BaseEntity, IAuditable
{
    public Guid UserId { get; private set; }
    public UserTokenType Type { get; private set; }
    public string TokenHash { get; private set; } = null!;
    public DateTimeOffset ExpiresAt { get; private set; }
    public DateTimeOffset? UsedAt { get; private set; }

    private UserToken()
    {
    }

    public static UserToken Issue(Guid userId, UserTokenType type, string tokenHash, DateTimeOffset expiresAt)
    {
        if (string.IsNullOrWhiteSpace(tokenHash))
        {
            throw new DomainException("user_token.hash_required");
        }

        return new UserToken
        {
            UserId = userId,
            Type = type,
            TokenHash = tokenHash,
            ExpiresAt = expiresAt,
        };
    }

    public bool IsValid(DateTimeOffset now) => UsedAt is null && ExpiresAt > now;

    public void MarkAsUsed(DateTimeOffset now)
    {
        if (UsedAt is not null)
        {
            throw new DomainException("user_token.already_used");
        }

        if (ExpiresAt <= now)
        {
            throw new DomainException("user_token.expired");
        }

        UsedAt = now;
    }
}
