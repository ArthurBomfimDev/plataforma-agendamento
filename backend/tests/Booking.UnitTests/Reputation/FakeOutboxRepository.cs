using Booking.Domain.Entity.Module.Notifications;
using Booking.Domain.Interface.Repository.Module.Notifications;

namespace Booking.UnitTests.Reputation;

/// <summary>Outbox de mentira para testar o orçamento de lembretes: só sabe dizer quantas entregas "existem".</summary>
internal sealed class FakeOutboxRepository(int createdInLast24Hours) : IOutboxRepository
{
    public void Add(OutboxMessage message) => throw new NotSupportedException();

    public Task<int> CountCreatedSinceAsync(DateTimeOffset since, CancellationToken ct = default) =>
        Task.FromResult(createdInLast24Hours);

    public Task<IReadOnlyList<OutboxMessage>> ClaimDueAsync(DateTimeOffset now, TimeSpan lease, int limit, CancellationToken ct = default) =>
        throw new NotSupportedException();
}
