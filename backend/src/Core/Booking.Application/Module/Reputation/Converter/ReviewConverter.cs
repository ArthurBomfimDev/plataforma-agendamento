using Booking.Arguments.Module.Reputation;
using Booking.Domain.Entity.Module.Reputation;

namespace Booking.Application.Module.Reputation.Converter;

public static class ReviewConverter
{
    public static PublicReviewResponse ToPublic(Review r) =>
        new(r.Id, r.Rating, r.ProfessionalRating, r.Comment, r.ReviewerName, r.ServiceName, r.ReviewedAt);

    public static MyReviewResponse ToMine(Review r, DateTimeOffset now) =>
        new(
            r.Id,
            r.AppointmentId,
            r.BusinessId,
            r.ProfessionalId,
            r.Rating,
            r.ProfessionalRating,
            r.Comment,
            r.ServiceName,
            r.ReviewedAt,
            r.EditedAt,
            r.CanEdit(now));

    public static OwnerReviewResponse ToOwner(Review r) =>
        new(r.Id, r.Rating, r.ProfessionalRating, r.Comment, r.ReviewerName, r.ServiceName, r.ReviewedAt, r.ReportedAt is not null);

    /// <summary>Sem id de consumidor: o Admin decide pelo texto, e só vê o nome abreviado, como o público.</summary>
    public static ModerationReviewResponse ToModeration(Review r, string businessName) =>
        new(
            r.Id,
            r.BusinessId,
            businessName,
            r.Rating,
            r.ProfessionalRating,
            r.Comment,
            r.ReviewerName,
            r.ReviewedAt,
            r.ReportReason,
            r.ReportedAt,
            r.HasOpenReport,
            r.IsHidden,
            r.HiddenReason,
            r.HiddenAt,
            r.HiddenByUserId);

    public static RatingSummaryResponse ToSummary(RatingSummary? summary) =>
        summary is null
            ? new RatingSummaryResponse(null, 0, [0, 0, 0, 0, 0], IsNew: true)
            : new RatingSummaryResponse(
                summary.Average is double average ? Math.Round(average, 1, MidpointRounding.AwayFromZero) : null,
                summary.Count,
                summary.Distribution,
                IsNew: !summary.HasAverage);
}
