using Booking.Domain.Event.Base;

namespace Booking.Domain.Entity.Base;

public abstract class AggregateRoot : BaseEntity
{
    private readonly List<IDomainEvent> _domainEvents = [];
    public IEnumerable<IDomainEvent> DomainEvents => _domainEvents;

    protected void AddDomainEvent(IDomainEvent domainEvent) => _domainEvents.Add(domainEvent);
    protected void RemoveDomainEvent(IDomainEvent domainEvent) => _domainEvents.Remove(domainEvent);
    protected void ClearDomainEvents() => _domainEvents.Clear();
}
