using Booking.Domain.Entity.Base;
using Booking.Domain.Entity.Module.Notifications;
using Booking.Domain.Enum.Module.Notifications;
using Booking.Domain.Interface.Repository.Module.Notifications;

namespace Booking.UnitTests.Notifications;

/// <summary>Guarda o que o notifier mandou para o sino; o resto da interface não é usado nos testes de unidade.</summary>
public sealed class FakeNotificationRepository : INotificationRepository
{
    public List<Notification> Added { get; } = [];

    public void Add(Notification notification) => Added.Add(notification);

    public Task<PagedResult<Notification>> ListAsync(Guid userId, NotificationAudience audience, Guid? businessId, PageRequest page, CancellationToken ct = default) =>
        throw new NotSupportedException();

    public Task<int> CountUnreadAsync(Guid userId, NotificationAudience audience, Guid? businessId, CancellationToken ct = default) =>
        throw new NotSupportedException();

    public Task<Notification?> FindOwnAsync(Guid id, Guid userId, NotificationAudience audience, Guid? businessId, CancellationToken ct = default) =>
        throw new NotSupportedException();

    public Task<int> MarkAllReadAsync(Guid userId, NotificationAudience audience, Guid? businessId, DateTimeOffset now, CancellationToken ct = default) =>
        throw new NotSupportedException();
}
