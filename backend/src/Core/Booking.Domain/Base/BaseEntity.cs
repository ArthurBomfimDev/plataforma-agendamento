namespace Booking.Domain.Base;

public abstract class BaseEntity
{
    protected BaseEntity()
    {
        Id = Guid.CreateVersion7();
    }

    public Guid Id { get; private set; }
}
