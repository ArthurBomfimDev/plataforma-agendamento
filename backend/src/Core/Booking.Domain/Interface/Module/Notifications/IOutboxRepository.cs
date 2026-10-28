using Booking.Domain.Entity.Module.Notifications;

namespace Booking.Domain.Interface.Repository.Module.Notifications;

public interface IOutboxRepository
{
    void Add(OutboxMessage message);

    /// <summary>
    /// Reivindica até <paramref name="limit"/> entregas vencidas, marcando <c>LockedUntil</c> numa instrução só, já
    /// confirmada. Duas instâncias do worker nunca pegam a mesma linha (<c>FOR UPDATE SKIP LOCKED</c>). Devolve as
    /// linhas rastreadas, para o chamador marcar o resultado.
    /// </summary>
    Task<IReadOnlyList<OutboxMessage>> ClaimDueAsync(DateTimeOffset now, TimeSpan lease, int limit, CancellationToken ct = default);
}
