using Booking.Domain.Entity.Module.Availability;
using Booking.Infrastructure.Persistence.Mapping.Base;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Booking.Infrastructure.Persistence.Mapping.Module.Availability;

public sealed class WorkScheduleMapping : BaseMapping<WorkSchedule>
{
    protected override void ConfigureEntity(EntityTypeBuilder<WorkSchedule> builder)
    {
        builder.ToTable("work_schedule", "availability");

        builder.Property(x => x.ProfessionalId).IsRequired();
        // Inteiro (0 = domingo), não texto: a listagem ordena por dia da semana.
        builder.Property(x => x.DayOfWeek).IsRequired();
        builder.Property(x => x.StartTime).IsRequired();
        builder.Property(x => x.EndTime).IsRequired();
        builder.Property(x => x.EffectiveFrom).IsRequired();

        builder.ToTable(t => t.HasCheckConstraint("ck_work_schedule_time", "end_time > start_time"));

        builder.HasIndex(x => new { x.BusinessId, x.ProfessionalId, x.DayOfWeek });
    }
}

public sealed class ScheduleExceptionMapping : BaseMapping<ScheduleException>
{
    protected override void ConfigureEntity(EntityTypeBuilder<ScheduleException> builder)
    {
        builder.ToTable("schedule_exception", "availability");

        builder.Property(x => x.Kind).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(x => x.StartsAt).IsRequired();
        builder.Property(x => x.EndsAt).IsRequired();
        builder.Property(x => x.Reason).HasMaxLength(200);

        builder.Ignore(x => x.Period);

        builder.ToTable(t => t.HasCheckConstraint("ck_schedule_exception_period", "ends_at > starts_at"));

        builder.HasIndex(x => new { x.BusinessId, x.ProfessionalId, x.StartsAt });
    }
}
