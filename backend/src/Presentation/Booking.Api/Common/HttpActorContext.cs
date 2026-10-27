using Booking.Application.Common.Tenancy;

namespace Booking.Api.Common;

/// <summary>Lê usuário, estabelecimento e papel ativos do token.</summary>
public sealed class HttpActorContext(IHttpContextAccessor accessor) : IActorContext
{
    public Guid? UserId => ReadGuid("sub");

    public Guid? BusinessId => ReadGuid(TenantClaims.BusinessId);

    public string? BusinessRole => accessor.HttpContext?.User.FindFirst(TenantClaims.ActiveContext)?.Value;

    public bool IsPlatformAdmin => accessor.HttpContext?.User.HasClaim(PlatformClaims.Role, PlatformClaims.AdminRole) ?? false;

    private Guid? ReadGuid(string claim) =>
        Guid.TryParse(accessor.HttpContext?.User.FindFirst(claim)?.Value, out Guid id) ? id : null;
}
