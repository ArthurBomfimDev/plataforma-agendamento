using Booking.Application.Common.Tenancy;

namespace Booking.Api.Common;

public sealed class HttpTenantContext(IHttpContextAccessor accessor) : ITenantContext
{
    public Guid? BusinessId =>
        Guid.TryParse(accessor.HttpContext?.User.FindFirst(TenantClaims.BusinessId)?.Value, out Guid id) ? id : null;
}
