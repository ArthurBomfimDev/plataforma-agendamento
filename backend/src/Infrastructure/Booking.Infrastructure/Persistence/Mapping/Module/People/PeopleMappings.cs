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
        builder.Property(x => x.Registration).HasMaxLength(Professional.MaxRegistrationLength);
        builder.Property(x => x.AuthorizationDeclarationVersion).HasMaxLength(60);

        // Sem FK para tenancy.business_membership: chave estrangeira não atravessa módulo (ADR-007, regra 3).
        builder.HasIndex(x => x.BusinessMembershipId).IsUnique().HasFilter("business_membership_id IS NOT NULL");
    }
}

/// <summary>Pedidos de remoção de perfil. Fora do tenant: o Admin lê os de todos os estabelecimentos.</summary>
public sealed class ProfessionalRemovalRequestMapping : BaseMapping<ProfessionalRemovalRequest>
{
    protected override void ConfigureEntity(EntityTypeBuilder<ProfessionalRemovalRequest> builder)
    {
        builder.ToTable("professional_removal_request", "people");

        builder.Property(x => x.BusinessId).IsRequired();
        builder.Property(x => x.ProfessionalId).IsRequired();
        builder.Property(x => x.Reason).HasMaxLength(ProfessionalRemovalRequest.MaxReasonLength).IsRequired();
        builder.Property(x => x.Contact).HasMaxLength(ProfessionalRemovalRequest.MaxContactLength);
        builder.Property(x => x.RequestedAt).IsRequired();
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(x => x.Resolution).HasMaxLength(500);

        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.ProfessionalId);
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
