using Booking.Application.Common.Persistence;
using Booking.Application.Common.Tenancy;
using Booking.Application.Module.Notifications.Queries;
using Booking.Arguments.Module.Notifications;
using Booking.Domain.Entity.Module.Notifications;
using Booking.Domain.Enum.Module.Notifications;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.Notifications;

namespace Booking.Application.Module.Notifications.Commands;

public sealed class MarkNotificationReadCommand(INotificationRepository notifications, IActorContext actor, IUnitOfWork unitOfWork, TimeProvider clock)
{
    public async Task<NotificationResponse> ExecuteAsync(Guid id, CancellationToken ct = default)
    {
        (Guid userId, NotificationAudience audience, Guid? businessId) = NotificationSide.Of(actor);

        // Aviso de outra pessoa ou do outro lado do sino não existe para quem pede: 404, nunca 403 (não confirma que há).
        Notification notification = await notifications.FindOwnAsync(id, userId, audience, businessId, ct)
            ?? throw new DomainException("notification.not_found");

        notification.MarkRead(clock.GetUtcNow());
        await unitOfWork.SaveChangesAsync(ct);

        return NotificationSide.ToResponse(notification);
    }
}

public sealed class MarkAllNotificationsReadCommand(INotificationRepository notifications, IActorContext actor, TimeProvider clock)
{
    /// <summary>Uma instrução só, já confirmada; devolve quantos eram não lidos.</summary>
    public async Task<UnreadCountResponse> ExecuteAsync(CancellationToken ct = default)
    {
        (Guid userId, NotificationAudience audience, Guid? businessId) = NotificationSide.Of(actor);
        int changed = await notifications.MarkAllReadAsync(userId, audience, businessId, clock.GetUtcNow(), ct);

        return new UnreadCountResponse(changed);
    }
}
