namespace Booking.Application.Common.Tenancy;

public static class TenantContextExtensions
{
    public static Guid RequireBusinessId(this ITenantContext tenantContext) =>
    tenantContext.BusinessId ?? throw new UnauthorizedAccessException("tenant.missing");
}
