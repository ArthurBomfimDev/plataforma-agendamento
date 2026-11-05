using Booking.Application.Common.Tenancy;

namespace Booking.Api.Common;

/// <summary>Lê o tenant ativo do token. Sem claim <c>businessId</c> não há tenant: consumidor e Admin atuam fora de empresa.</summary>
public sealed class HttpTenantContext(IHttpContextAccessor accessor) : ITenantContext
{
    public Guid? BusinessId =>
        Guid.TryParse(accessor.HttpContext?.User.FindFirst(TenantClaims.BusinessId)?.Value, out Guid id) ? id : null;
}
