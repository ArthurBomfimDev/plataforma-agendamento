using Booking.Domain.Entity.Module.Compliance;
using Booking.Infrastructure.Persistence.Mapping.Base;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Booking.Infrastructure.Persistence.Mapping.Module.Compliance;

public sealed class ConsentRecordMapping : BaseMapping<ConsentRecord>
{
    protected override void ConfigureEntity(EntityTypeBuilder<ConsentRecord> builder)
    {
        builder.ToTable("consent_record", "compliance");

        builder.Property(x => x.UserId).IsRequired();
        builder.Property(x => x.Purpose).HasConversion<string>().HasMaxLength(30).IsRequired();
        builder.Property(x => x.Version).HasMaxLength(30).IsRequired();
        builder.Property(x => x.GrantedAt).IsRequired();

        builder.HasIndex(x => new { x.UserId, x.Purpose });
    }
}

public sealed class SensitiveAccessLogMapping : BaseMapping<SensitiveAccessLog>
{
    protected override void ConfigureEntity(EntityTypeBuilder<SensitiveAccessLog> builder)
    {
        builder.ToTable("sensitive_access_log", "compliance");

        builder.Property(x => x.ActorUserId).IsRequired();
        builder.Property(x => x.AppointmentId).IsRequired();
        builder.Property(x => x.Action).HasMaxLength(30).IsRequired();
        builder.Property(x => x.OccurredAt).IsRequired();

        builder.HasIndex(x => new { x.AppointmentId, x.OccurredAt });
    }
}
