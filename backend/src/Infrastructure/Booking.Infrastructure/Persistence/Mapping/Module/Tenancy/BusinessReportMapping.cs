using Booking.Domain.Entity.Module.Tenancy;
using Booking.Infrastructure.Persistence.Mapping.Base;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Booking.Infrastructure.Persistence.Mapping.Module.Tenancy;

/// <summary>Denúncias da página pública. Fora do tenant: o Admin lê as de todos os estabelecimentos.</summary>
public sealed class BusinessReportMapping : BaseMapping<BusinessReport>
{
    protected override void ConfigureEntity(EntityTypeBuilder<BusinessReport> builder)
    {
        builder.ToTable("business_report", "tenancy");

        builder.Property(x => x.BusinessId).IsRequired();
        builder.Property(x => x.Reason).HasMaxLength(BusinessReport.MaxReasonLength).IsRequired();
        builder.Property(x => x.ReportedAt).IsRequired();
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(x => x.Resolution).HasMaxLength(500);

        // A fila do Admin: as abertas, as mais antigas primeiro (o Guid v7 cresce com o tempo).
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.BusinessId);
    }
}
