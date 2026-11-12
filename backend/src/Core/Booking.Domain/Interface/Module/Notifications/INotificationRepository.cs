using Booking.Domain.Entity.Base;
using Booking.Domain.Entity.Module.Notifications;
using Booking.Domain.Enum.Module.Notifications;

namespace Booking.Domain.Interface.Repository.Module.Notifications;

/// <summary>
/// O sino é sempre lido pelo dono do aviso, num lado só: <paramref name="businessId"/> nulo é o lado do consumidor, preenchido
/// é o painel daquele estabelecimento.
/// </summary>
public interface INotificationRepository
{
    void Add(Notification notification);

    Task<PagedResult<Notification>> ListAsync(Guid userId, NotificationAudience audience, Guid? businessId, PageRequest page, CancellationToken ct = default);

    Task<int> CountUnreadAsync(Guid userId, NotificationAudience audience, Guid? businessId, CancellationToken ct = default);

    /// <summary>Só devolve se o aviso for da pessoa e do lado pedido; de outra pessoa, é como se não existisse.</summary>
    Task<Notification?> FindOwnAsync(Guid id, Guid userId, NotificationAudience audience, Guid? businessId, CancellationToken ct = default);

    /// <summary>Marca como lidos todos os não lidos do lado pedido, numa instrução só. Devolve quantos mudaram.</summary>
    Task<int> MarkAllReadAsync(Guid userId, NotificationAudience audience, Guid? businessId, DateTimeOffset now, CancellationToken ct = default);
}
