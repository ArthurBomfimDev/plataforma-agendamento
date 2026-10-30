using Booking.Domain.Entity.Module.Notifications;
using Booking.Infrastructure.Persistence.Mapping.Base;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Booking.Infrastructure.Persistence.Mapping.Module.Notifications;

/// <summary>A tabela <c>outbox</c> das decisões de 22/09 (ADR-021). Fora do tenant: o worker lê de todos.</summary>
public sealed class OutboxMessageMapping : BaseMapping<OutboxMessage>
{
    protected override void ConfigureEntity(EntityTypeBuilder<OutboxMessage> builder)
    {
        builder.ToTable("outbox", "notifications");

        builder.Property(x => x.Type).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Payload).HasColumnType("jsonb").IsRequired();
        builder.Property(x => x.NextAttemptAt).IsRequired();
        builder.Property(x => x.Attempts).IsRequired();
        builder.Property(x => x.LastError).HasMaxLength(OutboxMessage.MaxErrorLength);

        builder.Ignore(x => x.IsPending);

        // A fila do worker: só as pendentes, na ordem em que vencem.
        builder.HasIndex(x => x.NextAttemptAt)
            .HasFilter("processed_at IS NULL AND failed_at IS NULL")
            .HasDatabaseName("ix_outbox_pending_next_attempt_at");
    }
}
