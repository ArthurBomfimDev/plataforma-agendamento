using Booking.Domain.Entity.Module.Availability;
using Booking.Infrastructure.Persistence.Mapping.Base;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Booking.Infrastructure.Persistence.Mapping.Module.Availability;

public sealed class HolidayMapping : BaseMapping<Holiday>
{
    protected override void ConfigureEntity(EntityTypeBuilder<Holiday> builder)
    {
        builder.ToTable("holiday", "availability");

        builder.Property(x => x.Date).IsRequired();
        builder.Property(x => x.Name).IsRequired().HasMaxLength(80);
        builder.Property(x => x.Kind).HasConversion<string>().HasMaxLength(20);

        builder.HasIndex(x => new { x.Date, x.Name }).IsUnique();
        builder.HasIndex(x => x.Date).IsUnique();
    }
}
