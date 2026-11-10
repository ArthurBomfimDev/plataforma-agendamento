using Booking.Domain.Entity.Module.Tenancy;
using Booking.Infrastructure.Persistence.Mapping.Base;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Booking.Infrastructure.Persistence.Mapping.Module.Tenancy;

public sealed class BusinessInvitationMapping : BaseMapping<BusinessInvitation>
{
    protected override void ConfigureEntity(EntityTypeBuilder<BusinessInvitation> builder)
    {
        builder.ToTable("business_invitation", "tenancy");

        builder.Property(x => x.Email).HasMaxLength(254).IsRequired();
        builder.Property(x => x.InviteeName).HasMaxLength(BusinessInvitation.MaxNameLength).IsRequired();
        builder.Property(x => x.Role).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(x => x.Specialty).HasMaxLength(BusinessInvitation.MaxSpecialtyLength);
        builder.Property(x => x.InvitedByUserId).IsRequired();
        builder.Property(x => x.TokenHash).HasMaxLength(128).IsRequired();
        builder.Property(x => x.ExpiresAt).IsRequired();
        builder.Property(x => x.LastSentAt).IsRequired();
        builder.Property(x => x.TermsVersion).HasMaxLength(60);

        // O link é achado pelo hash, em qualquer estabelecimento; ele precisa ser único.
        builder.HasIndex(x => x.TokenHash).IsUnique();
        builder.HasIndex(x => new { x.BusinessId, x.Email });
    }
}
