using Booking.Domain.Entity.Module.People;
using Booking.Domain.ValueObject;
using Booking.Infrastructure.Persistence.Mapping.Base;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Booking.Infrastructure.Persistence.Mapping.Module.People;

public sealed class ProfessionalMapping : BaseMapping<Professional>
{
    protected override void ConfigureEntity(EntityTypeBuilder<Professional> builder)
    {
        builder.ToTable("professional", "people");

        builder.Property(x => x.DisplayName).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Specialty).HasMaxLength(100);
        builder.Property(x => x.Bio).HasMaxLength(1000);
        builder.Property(x => x.PhotoImageKey).HasMaxLength(ImageKey.MaxLength);

        // Sem FK para tenancy.business_membership: chave estrangeira não atravessa módulo (ADR-007, regra 3).
        builder.HasIndex(x => x.BusinessMembershipId).IsUnique().HasFilter("business_membership_id IS NOT NULL");
    }
}

public sealed class CustomerMapping : BaseMapping<Customer>
{
    protected override void ConfigureEntity(EntityTypeBuilder<Customer> builder)
    {
        builder.ToTable("customer", "people");

        builder.Property(x => x.UserId).IsRequired();
        builder.Property(x => x.BirthDate).IsRequired();
        builder.Property(x => x.SocialName).HasMaxLength(150);

        builder.HasIndex(x => x.UserId).IsUnique();
    }
}
