using Booking.Domain.Entity.Base;
using Booking.Domain.Entity.Module.Reputation;
using Booking.Domain.Enum.Module.Reputation;
using Booking.Domain.Interface.Repository.Module.Reputation;
using Booking.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace Booking.Infrastructure.Module.Reputation.Repository;

public sealed class ReviewRepository(BookingDbContext context) : IReviewRepository
{
    // Entre estabelecimentos por natureza: o consumidor não tem tenant no token. A chave é o agendamento.
    public Task<Review?> GetByAppointmentAsync(Guid appointmentId, CancellationToken ct = default) =>
        context.AcrossTenants<Review>().FirstOrDefaultAsync(x => x.AppointmentId == appointmentId, ct);

    public Task<PagedResult<Review>> ListOfBusinessAsync(Guid businessId, PageRequest page, CancellationToken ct = default) =>
        context.OfBusiness<Review>(businessId).AsNoTracking()
            .Where(x => !x.IsHidden)
            .OrderByDescending(x => x.ReviewedAt).ThenByDescending(x => x.Id)
            .ToPagedAsync(page, ct);

    public Task<PagedResult<Review>> ListOfProfessionalAsync(Guid professionalId, PageRequest page, CancellationToken ct = default) =>
        context.AcrossTenants<Review>().AsNoTracking()
            .Where(x => x.ProfessionalId == professionalId && !x.IsHidden)
            .OrderByDescending(x => x.ReviewedAt).ThenByDescending(x => x.Id)
            .ToPagedAsync(page, ct);

    public Task<PagedResult<Review>> ListOfCustomerAsync(Guid customerId, PageRequest page, CancellationToken ct = default) =>
        context.AcrossTenants<Review>().AsNoTracking()
            .Where(x => x.CustomerId == customerId)
            .OrderByDescending(x => x.ReviewedAt).ThenByDescending(x => x.Id)
            .ToPagedAsync(page, ct);

    public Task<Review?> GetByIdAsync(Guid reviewId, CancellationToken ct = default) =>
        context.AcrossTenants<Review>().FirstOrDefaultAsync(x => x.Id == reviewId, ct);

    public Task<Review?> GetOfBusinessAsync(Guid businessId, Guid reviewId, CancellationToken ct = default) =>
        context.OfBusiness<Review>(businessId).FirstOrDefaultAsync(x => x.Id == reviewId, ct);

    public Task<PagedResult<Review>> ListWithOpenReportAsync(PageRequest page, CancellationToken ct = default) =>
        context.AcrossTenants<Review>().AsNoTracking()
            .Where(x => x.ReportedAt != null && x.ReportClosedAt == null)
            .OrderBy(x => x.ReportedAt).ThenBy(x => x.Id)
            .ToPagedAsync(page, ct);

    public Task<PagedResult<Review>> ListHiddenAsync(PageRequest page, CancellationToken ct = default) =>
        context.AcrossTenants<Review>().AsNoTracking()
            .Where(x => x.IsHidden)
            .OrderByDescending(x => x.HiddenAt).ThenByDescending(x => x.Id)
            .ToPagedAsync(page, ct);

    public void Add(Review review) => context.Set<Review>().Add(review);
}

public sealed class RatingSummaryRepository(BookingDbContext context) : IRatingSummaryRepository
{
    public Task<RatingSummary?> GetAsync(Guid businessId, RatingTarget target, Guid targetId, CancellationToken ct = default) =>
        context.OfBusiness<RatingSummary>(businessId).FirstOrDefaultAsync(x => x.Target == target && x.TargetId == targetId, ct);

    public void Add(RatingSummary summary) => context.Set<RatingSummary>().Add(summary);
}
