using Booking.Domain.Entity.Module.Identity;
using Booking.Domain.ValueObject;
using Booking.Infrastructure.Persistence.Mapping.Base;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Booking.Infrastructure.Persistence.Mapping.Module.Identity;

public sealed class UserMapping : BaseMapping<User>
{
    protected override void ConfigureEntity(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("user", "identity");

        builder.Property(x => x.Email)
            .HasConversion(email => email.Address, address => Email.Of(address))
            .HasMaxLength(254)
            .IsRequired();

        builder.Property(x => x.PasswordHash).HasMaxLength(255).IsRequired();
        builder.Property(x => x.FullName).HasMaxLength(150).IsRequired();
        builder.Property(x => x.EmailConfirmedAt);
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(20).IsRequired();

        builder.HasIndex(x => x.Email).IsUnique();
    }
}
