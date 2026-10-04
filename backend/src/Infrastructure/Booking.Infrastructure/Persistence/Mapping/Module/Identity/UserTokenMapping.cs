using Booking.Domain.Entity.Module.Identity;
using Booking.Infrastructure.Persistence.Mapping.Base;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Booking.Infrastructure.Persistence.Mapping.Module.Identity;

public sealed class UserTokenMapping : BaseMapping<UserToken>
{
    protected override void ConfigureEntity(EntityTypeBuilder<UserToken> builder)
    {
        builder.ToTable("user_token", "identity");

        builder.Property(x => x.UserId).IsRequired();
        builder.Property(x => x.Type).HasConversion<string>().HasMaxLength(30).IsRequired();
        builder.Property(x => x.TokenHash).HasMaxLength(64).IsRequired();
        builder.Property(x => x.ExpiresAt).IsRequired();
        builder.Property(x => x.UsedAt);

        builder.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(x => new { x.Type, x.TokenHash }).IsUnique();
        builder.HasIndex(x => x.UserId);
    }
}
