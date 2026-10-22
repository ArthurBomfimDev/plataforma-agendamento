using Booking.Domain.Entity.Module.Tenancy;
using Booking.Infrastructure.Persistence.Mapping.Base;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Booking.Infrastructure.Persistence.Mapping.Module.Tenancy;

public sealed class BusinessMembershipMapping : BaseMapping<BusinessMembership>
{
    protected override void ConfigureEntity(EntityTypeBuilder<BusinessMembership> builder)
    {
        builder.ToTable("business_membership", "tenancy");

        builder.Property(x => x.UserId).IsRequired();
        builder.Property(x => x.Role).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(20).IsRequired();

        builder.HasIndex(x => new { x.BusinessId, x.UserId }).IsUnique();
    }
}
