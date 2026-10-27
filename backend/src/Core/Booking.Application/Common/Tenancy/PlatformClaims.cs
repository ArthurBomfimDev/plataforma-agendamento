namespace Booking.Application.Common.Tenancy;

/// <summary>
/// Papel de plataforma no token (ADR-020). Independe de <see cref="TenantClaims"/>: um Admin pode ter ou não um
/// estabelecimento ativo no contexto, e o <c>businessId</c> não dá nem tira o papel de plataforma.
/// </summary>
public static class PlatformClaims
{
    public const string Role = "platform";
    public const string AdminRole = "admin";
}
