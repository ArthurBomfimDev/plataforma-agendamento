using Booking.Domain.Entity.Module.Identity;

namespace Booking.Application.Contracts.Identity;

public sealed record AccessToken(string Value, DateTimeOffset ExpiresAt);

/// <summary>Estabelecimento e papel ativos que o token carrega (ADR-004).</summary>
public sealed record BusinessContext(Guid BusinessId, string Role);

public interface IAccessTokenIssuer
{
    AccessToken Issue(User user, DateTimeOffset now, BusinessContext? context = null);
}
