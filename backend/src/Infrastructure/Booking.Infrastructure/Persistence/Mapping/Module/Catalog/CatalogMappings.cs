using Booking.Domain.Entity.Module.Catalog;
using Booking.Infrastructure.Persistence.Mapping.Base;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Booking.Infrastructure.Persistence.Mapping.Module.Catalog;

public sealed class ServiceMapping : BaseMapping<Service>
{
    protected override void ConfigureEntity(EntityTypeBuilder<Service> builder)
    {
        builder.ToTable("service", "catalog");

        builder.Property(x => x.Name).HasMaxLength(120).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(1000);
        builder.Property(x => x.SuppliesNote).HasMaxLength(500);
        builder.Property(x => x.DurationMinutes).IsRequired();
        builder.Property(x => x.BufferBeforeMinutes).IsRequired();
        builder.Property(x => x.BufferAfterMinutes).IsRequired();
        builder.Property(x => x.SlotStepMinutes).IsRequired();
        builder.Property(x => x.PriceCents).IsRequired();

        builder.ToTable(t =>
        {
            t.HasCheckConstraint("ck_service_duration", "duration_minutes > 0 AND duration_minutes <= 480");
            t.HasCheckConstraint("ck_service_price", "price_cents >= 0");
        });
    }
}

public sealed class ServiceProfessionalMapping : BaseMapping<ServiceProfessional>
{
    protected override void ConfigureEntity(EntityTypeBuilder<ServiceProfessional> builder)
    {
        builder.ToTable("service_professional", "catalog");

        builder.Property(x => x.ServiceId).IsRequired();
        builder.Property(x => x.ProfessionalId).IsRequired();

        // FK só para dentro do módulo (service). professional_id fica sem FK: People é outro módulo.
        builder.HasOne<Service>().WithMany().HasForeignKey(x => x.ServiceId).OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.ServiceId, x.ProfessionalId }).IsUnique();
        builder.HasIndex(x => x.ProfessionalId);
    }
}
