using Booking.Domain.Entity.Module.Scheduling;
using Booking.Infrastructure.Persistence.Mapping.Base;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Booking.Infrastructure.Persistence.Mapping.Module.Scheduling;

/// <summary>
/// A constraint <c>appointment_no_overlap</c> está na migration AddCoreModules, em SQL: o modelo do EF não
/// descreve <c>EXCLUDE USING gist</c>.
/// </summary>
public sealed class AppointmentMapping : BaseMapping<Appointment>
{
    public const string NoOverlapConstraint = "appointment_no_overlap";
    public const string IdempotencyIndex = "ix_appointment_customer_id_idempotency_key";

    protected override void ConfigureEntity(EntityTypeBuilder<Appointment> builder)
    {
        builder.ToTable("appointment", "scheduling");

        builder.Property(x => x.ProfessionalId).IsRequired();
        builder.Property(x => x.ServiceId).IsRequired();
        builder.Property(x => x.WalkInName).HasMaxLength(150);
        builder.Property(x => x.WalkInPhone).HasMaxLength(20);
        builder.Property(x => x.StartsAt).IsRequired();
        builder.Property(x => x.EndsAt).IsRequired();
        builder.Property(x => x.BlockedStartsAt).IsRequired();
        builder.Property(x => x.BlockedEndsAt).IsRequired();
        builder.Property(x => x.ServiceNameSnapshot).HasMaxLength(120).IsRequired();
        builder.Property(x => x.PriceCents).IsRequired();

        // Texto, não número: os nomes entram no WHERE da constraint de exclusão.
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(x => x.Source).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(x => x.CancelledBy).HasConversion<string>().HasMaxLength(20);

        builder.Property(x => x.CustomerNotes).HasMaxLength(500);
        builder.Property(x => x.BusinessNotes).HasMaxLength(500);
        builder.Property(x => x.CancellationReason).HasMaxLength(500);
        builder.Property(x => x.IdempotencyKey).HasMaxLength(64);

        builder.Ignore(x => x.BlockedRange);

        builder.HasMany(x => x.History).WithOne().HasForeignKey(e => e.AppointmentId).OnDelete(DeleteBehavior.Restrict);
        builder.Navigation(x => x.History).UsePropertyAccessMode(PropertyAccessMode.Field).HasField("_history");

        builder.HasIndex(x => new { x.CustomerId, x.IdempotencyKey })
            .IsUnique()
            .HasFilter("idempotency_key IS NOT NULL")
            .HasDatabaseName(IdempotencyIndex);

        builder.HasIndex(x => new { x.BusinessId, x.StartsAt });
        builder.HasIndex(x => new { x.CustomerId, x.StartsAt });
        builder.HasIndex(x => new { x.Status, x.ExpiresAt });

        builder.ToTable(t =>
        {
            t.HasCheckConstraint("ck_appointment_period", "ends_at > starts_at");
            t.HasCheckConstraint("ck_appointment_blocked_range", "blocked_starts_at <= starts_at AND blocked_ends_at >= ends_at");
        });
    }
}

public sealed class AppointmentEventMapping : BaseMapping<AppointmentEvent>
{
    protected override void ConfigureEntity(EntityTypeBuilder<AppointmentEvent> builder)
    {
        builder.ToTable("appointment_event", "scheduling");

        builder.Property(x => x.FromStatus).HasConversion<string>().HasMaxLength(20);
        builder.Property(x => x.ToStatus).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(x => x.ActorRole).HasMaxLength(20).IsRequired();
        builder.Property(x => x.OccurredAt).IsRequired();
        builder.Property(x => x.Note).HasMaxLength(500);

        builder.HasIndex(x => new { x.AppointmentId, x.OccurredAt });
    }
}
