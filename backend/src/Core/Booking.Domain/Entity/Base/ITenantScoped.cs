namespace Booking.Domain.Entity.Base;

public interface ITenantScoped
{
    Guid BusinessId { get; }
}
