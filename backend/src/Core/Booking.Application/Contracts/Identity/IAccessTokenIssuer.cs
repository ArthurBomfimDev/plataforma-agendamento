using Booking.Domain.Entity.Module.Identity;

namespace Booking.Application.Contracts.Identity;

public sealed record AccessToken(string Value, DateTimeOffset ExpiresAt);

public interface IAccessTokenIssuer
{
    AccessToken Issue(User user, DateTimeOffset now);
}
