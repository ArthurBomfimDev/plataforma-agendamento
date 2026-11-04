using Booking.Domain.Entity.Module.Reputation;
using Booking.Infrastructure.Persistence.Mapping.Base;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Booking.Infrastructure.Persistence.Mapping.Module.Reputation;

public sealed class ReviewMapping : BaseMapping<Review>
{
    /// <summary>Uma avaliação por agendamento: o índice é a trava de verdade (a conferência no comando só dá a mensagem).</summary>
    public const string AppointmentIndex = "ux_review_appointment";

    protected override void ConfigureEntity(EntityTypeBuilder<Review> builder)
    {
        builder.ToTable("review", "reputation");

        builder.Property(x => x.AppointmentId).IsRequired();
        builder.Property(x => x.ProfessionalId).IsRequired();
        builder.Property(x => x.CustomerId).IsRequired();
        builder.Property(x => x.Rating).IsRequired();
        builder.Property(x => x.Comment).HasMaxLength(Review.MaxCommentLength);
        builder.Property(x => x.ReviewerName).HasMaxLength(100).IsRequired();
        builder.Property(x => x.ServiceName).HasMaxLength(100);
        builder.Property(x => x.ReviewedAt).IsRequired();
        builder.Property(x => x.HiddenReason).HasMaxLength(500);

        builder.HasIndex(x => x.AppointmentId).IsUnique().HasDatabaseName(AppointmentIndex);
        builder.HasIndex(x => new { x.BusinessId, x.IsHidden, x.ReviewedAt });
        builder.HasIndex(x => new { x.ProfessionalId, x.IsHidden, x.ReviewedAt });
        builder.HasIndex(x => x.CustomerId);

        builder.ToTable(t =>
        {
            t.HasCheckConstraint("ck_review_rating", "rating BETWEEN 1 AND 5");
            t.HasCheckConstraint("ck_review_professional_rating", "professional_rating IS NULL OR professional_rating BETWEEN 1 AND 5");
        });
    }
}

public sealed class RatingSummaryMapping : BaseMapping<RatingSummary>
{
    protected override void ConfigureEntity(EntityTypeBuilder<RatingSummary> builder)
    {
        builder.ToTable("rating_summary", "reputation");

        builder.Property(x => x.Target).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(x => x.TargetId).IsRequired();
        builder.Ignore(x => x.HasAverage);
        builder.Ignore(x => x.Average);
        builder.Ignore(x => x.Distribution);

        // Dois pedidos ao mesmo tempo sobre o mesmo alvo: o segundo vê que a linha mudou e é recusado (503, tentar de
        // novo), em vez de perder uma contagem. `xmin` é a coluna de sistema do PostgreSQL; a migration não a cria.
        builder.Property<uint>("xmin").HasColumnType("xid").ValueGeneratedOnAddOrUpdate().IsConcurrencyToken();

        builder.HasIndex(x => new { x.Target, x.TargetId }).IsUnique().HasDatabaseName(TargetIndex);
    }

    /// <summary>Um resumo por alvo. Dois "primeiros" ao mesmo tempo: o segundo viola o índice e tenta de novo.</summary>
    public const string TargetIndex = "ux_rating_summary_target";
}
