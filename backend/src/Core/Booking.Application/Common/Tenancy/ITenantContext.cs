namespace Booking.Application.Common.Tenancy;

public interface ITenantContext
{
    Guid? BusinessId { get; }
}
