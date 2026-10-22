using Booking.Domain.Entity.Module.Tenancy;
using Booking.Domain.ValueObject;
using Booking.Infrastructure.Persistence.Mapping.Base;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Booking.Infrastructure.Persistence.Mapping.Module.Tenancy;

public sealed class BusinessMapping : BaseMapping<Business>
{
    protected override void ConfigureEntity(EntityTypeBuilder<Business> builder)
    {
        builder.ToTable("business", "tenancy");

        builder.Property(x => x.Name).IsRequired().HasMaxLength(150);

        builder.Property(x => x.Document)
            .HasConversion(doc => doc.Number, number => Document.Of(number))
            .HasColumnName("document_number")
            .HasMaxLength(14)
            .IsRequired();

        builder.Property(x => x.Category).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(x => x.SeatLimit).IsRequired();
        builder.Property(x => x.TimeZone).HasMaxLength(64).IsRequired();

        builder.Property(x => x.Street).HasMaxLength(150);
        builder.Property(x => x.StreetNumber).HasMaxLength(20);
        builder.Property(x => x.District).HasMaxLength(100);
        builder.Property(x => x.City).HasMaxLength(100);
        builder.Property(x => x.State).HasMaxLength(2);
        builder.Property(x => x.PostalCode).HasMaxLength(8);

        builder.Property(x => x.VerificationLevel).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(x => x.VerificationNote).HasMaxLength(500);

        builder.Property(x => x.Location)
            .HasConversion(new GeoPointValueConverter())
            .HasColumnType("geography (point)");

        builder.Property(x => x.LocationPrecision).HasConversion<string>().HasMaxLength(20);
        builder.Property(x => x.LocationSource).HasMaxLength(100);

        builder.Ignore(x => x.IsBookable);

        builder.HasIndex(x => x.Document).IsUnique();
        builder.HasIndex(x => x.Location).HasMethod("gist");
    }
}
