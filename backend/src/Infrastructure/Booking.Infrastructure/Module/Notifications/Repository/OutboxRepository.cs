using Booking.Domain.Entity.Module.Notifications;
using Booking.Domain.Interface.Repository.Module.Notifications;
using Booking.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace Booking.Infrastructure.Module.Notifications.Repository;

public sealed class OutboxRepository(BookingDbContext context) : IOutboxRepository
{
    public void Add(OutboxMessage message) => context.Set<OutboxMessage>().Add(message);

    // Uma instrução só, confirmada sozinha: a reivindicação vale antes de o envio começar. SKIP LOCKED faz duas
    // instâncias do worker dividirem a fila sem esperar uma pela outra e sem pegar a mesma linha.
    public async Task<IReadOnlyList<OutboxMessage>> ClaimDueAsync(DateTimeOffset now, TimeSpan lease, int limit, CancellationToken ct = default) =>
        await context.Set<OutboxMessage>()
            .FromSql($"""
                UPDATE notifications.outbox SET locked_until = {now + lease}
                WHERE id IN (
                    SELECT id FROM notifications.outbox
                    WHERE processed_at IS NULL AND failed_at IS NULL
                      AND next_attempt_at <= {now}
                      AND (locked_until IS NULL OR locked_until < {now})
                    ORDER BY next_attempt_at
                    LIMIT {limit}
                    FOR UPDATE SKIP LOCKED)
                RETURNING *
                """)
            .ToListAsync(ct);
}
