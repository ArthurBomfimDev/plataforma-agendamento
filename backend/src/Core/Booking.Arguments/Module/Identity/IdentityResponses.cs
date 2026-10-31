namespace Booking.Arguments.Module.Identity;

public sealed record AuthResponse(string AccessToken, DateTimeOffset AccessTokenExpiresAt, string RefreshToken);

public sealed record UserResponse(Guid Id, string Email, string FullName, bool EmailConfirmed);

/// <summary>Estabelecimento em que a conta tem vínculo ativo: um item do seletor de contexto.</summary>
public sealed record UserBusinessResponse(Guid BusinessId, string Name, string Role);

/// <summary>
/// A conta e os contextos que ela pode abrir (decisão de 22/09, §2.0): consumidor, se tiver perfil, e o painel de
/// cada estabelecimento com vínculo ativo.
/// </summary>
public sealed record CurrentUserResponse(
    Guid Id,
    string Email,
    string FullName,
    bool EmailConfirmed,
    bool HasCustomerProfile,
    IReadOnlyList<UserBusinessResponse> Businesses);

public sealed record ContextTokenResponse(string AccessToken, DateTimeOffset AccessTokenExpiresAt, Guid? BusinessId, string? Role);
