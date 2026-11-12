using Booking.Domain.Entity.Module.Notifications;
using Booking.Infrastructure.Persistence.Mapping.Base;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Booking.Infrastructure.Persistence.Mapping.Module.Notifications;

/// <summary>
/// O sino do aplicativo. Fora do tenant: o aviso é da pessoa, e quem lê é sempre o dono dele (a consulta filtra por
/// <c>user_id</c>, lado e estabelecimento). Sem chave estrangeira: <c>business_id</c> e <c>appointment_id</c> são de outros
/// módulos, e o aviso sobrevive ao que o originou.
/// </summary>
public sealed class NotificationMapping : BaseMapping<Notification>
{
    protected override void ConfigureEntity(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("notification", "notifications");

        builder.Property(x => x.UserId).IsRequired();
        builder.Property(x => x.Audience).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(x => x.Type).HasConversion<string>().HasMaxLength(40).IsRequired();
        builder.Property(x => x.Title).HasMaxLength(Notification.MaxTitleLength).IsRequired();
        builder.Property(x => x.Body).HasMaxLength(Notification.MaxBodyLength).IsRequired();

        builder.Property(x => x.OccurredAt).IsRequired();

        builder.Ignore(x => x.IsRead);

        // A lista e o contador: por pessoa e lado, do mais novo para o mais velho.
        builder.HasIndex(x => new { x.UserId, x.Audience, x.BusinessId, x.OccurredAt })
            .HasDatabaseName("ix_notification_user_side");

        // O contador de não lidas roda a cada poucos segundos: índice parcial só com o que ainda não foi lido.
        builder.HasIndex(x => new { x.UserId, x.Audience, x.BusinessId })
            .HasFilter("read_at IS NULL")
            .HasDatabaseName("ix_notification_unread");
    }
}
