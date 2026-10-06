using Booking.Application.Common.Tenancy;

namespace Booking.Api.Common;

<<<<<<< HEAD
=======
/// <summary>Lê o tenant ativo do token. Sem claim <c>businessId</c> não há tenant: consumidor e Admin atuam fora de empresa.</summary>
>>>>>>> 072927b623995e9cdf1f2a39df62404aca1719cf
public sealed class HttpTenantContext(IHttpContextAccessor accessor) : ITenantContext
{
    public Guid? BusinessId =>
        Guid.TryParse(accessor.HttpContext?.User.FindFirst(TenantClaims.BusinessId)?.Value, out Guid id) ? id : null;
}
