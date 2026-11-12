using Booking.Domain.Entity.Base;
using Booking.Domain.Entity.Module.Notifications;
using Booking.Domain.Enum.Module.Notifications;
using Booking.Domain.Interface.Repository.Module.Notifications;
using Booking.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace Booking.Infrastructure.Module.Notifications.Repository;

public sealed class NotificationRepository(BookingDbContext context) : INotificationRepository
{
    public void Add(Notification notification) => context.Set<Notification>().Add(notification);

    public Task<PagedResult<Notification>> ListAsync(
        Guid userId, NotificationAudience audience, Guid? businessId, PageRequest page, CancellationToken ct = default) =>
        Side(userId, audience, businessId).AsNoTracking()
            .OrderByDescending(x => x.OccurredAt)
            .ThenByDescending(x => x.Id)
            .ToPagedAsync(page, ct);

    public Task<int> CountUnreadAsync(Guid userId, NotificationAudience audience, Guid? businessId, CancellationToken ct = default) =>
        Side(userId, audience, businessId).CountAsync(x => x.ReadAt == null, ct);

    public Task<Notification?> FindOwnAsync(Guid id, Guid userId, NotificationAudience audience, Guid? businessId, CancellationToken ct = default) =>
        Side(userId, audience, businessId).FirstOrDefaultAsync(x => x.Id == id, ct);

    public Task<int> MarkAllReadAsync(Guid userId, NotificationAudience audience, Guid? businessId, DateTimeOffset now, CancellationToken ct = default) =>
        Side(userId, audience, businessId)
            .Where(x => x.ReadAt == null)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.ReadAt, now), ct);

    public Task<int> DeleteExpiredAsync(DateTimeOffset readBefore, DateTimeOffset createdBefore, CancellationToken ct = default) =>
        context.Set<Notification>()
            .Where(x => (x.ReadAt != null && x.ReadAt < readBefore) || x.OccurredAt < createdBefore)
            .ExecuteDeleteAsync(ct);

    private IQueryable<Notification> Side(Guid userId, NotificationAudience audience, Guid? businessId) =>
        context.Set<Notification>().Where(x => x.UserId == userId
            && x.Audience == audience
            && (audience == NotificationAudience.Customer || x.BusinessId == businessId));
}
