namespace Booking.Domain.Entity.Base;

public abstract class BaseEntity
{
    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public override bool Equals(object? obj) => obj is BaseEntity other && GetType() == other.GetType() && Id.Equals(other.Id);

    public override int GetHashCode() => Id.GetHashCode();
}
