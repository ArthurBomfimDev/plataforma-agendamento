using Booking.Application.Common.Tenancy;
using Booking.Arguments.Module.Notifications;
using Booking.Domain.Entity.Base;
using Booking.Domain.Entity.Module.Notifications;
using Booking.Domain.Enum.Module.Notifications;
using Booking.Domain.Interface.Repository.Module.Notifications;

namespace Booking.Application.Module.Notifications.Queries;

/// <summary>
/// De que lado o sino está sendo lido: o token com estabelecimento ativo lê o do painel daquele estabelecimento; sem ele, o do
/// consumidor. Quem troca de contexto troca de sino, e nenhum dos dois mostra o do outro.
/// </summary>
internal static class NotificationSide
{
    public static (Guid UserId, NotificationAudience Audience, Guid? BusinessId) Of(IActorContext actor) =>
        actor.BusinessId is Guid businessId
            ? (actor.RequireUserId(), NotificationAudience.Business, businessId)
            : (actor.RequireUserId(), NotificationAudience.Customer, null);

    public static NotificationResponse ToResponse(Notification n) =>
        new(n.Id, n.Type.ToString(), n.Title, n.Body, n.AppointmentId, n.OccurredAt, n.ReadAt);
}

public sealed class ListMyNotificationsQuery(INotificationRepository notifications, IActorContext actor)
{
    public async Task<PagedResult<NotificationResponse>> ExecuteAsync(PageRequest page, CancellationToken ct = default)
    {
        (Guid userId, NotificationAudience audience, Guid? businessId) = NotificationSide.Of(actor);
        PagedResult<Notification> result = await notifications.ListAsync(userId, audience, businessId, page, ct);

        return new PagedResult<NotificationResponse>([.. result.Items.Select(NotificationSide.ToResponse)], result.Page, result.PageSize, result.TotalCount);
    }
}

public sealed class CountMyUnreadNotificationsQuery(INotificationRepository notifications, IActorContext actor)
{
    public async Task<UnreadCountResponse> ExecuteAsync(CancellationToken ct = default)
    {
        (Guid userId, NotificationAudience audience, Guid? businessId) = NotificationSide.Of(actor);
        return new UnreadCountResponse(await notifications.CountUnreadAsync(userId, audience, businessId, ct));
    }
}
