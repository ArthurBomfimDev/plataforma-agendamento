using Booking.Application.Common.Persistence;
using Booking.Application.Common.Tenancy;
using Booking.Application.Contracts.Tenancy;
using Booking.Application.Module.Reputation.Converter;
using Booking.Arguments.Module.Reputation;
using Booking.Domain.Entity.Module.Reputation;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.Reputation;

namespace Booking.Application.Module.Reputation.Commands;

/// <summary>
/// O dono denuncia uma avaliação do próprio estabelecimento (ADR-032). Só abre a fila do Admin: a avaliação segue pública
/// até ele decidir. De outro estabelecimento responde como inexistente.
/// </summary>
public sealed class ReportReviewCommand(IReviewRepository reviews, IActorContext actor, IUnitOfWork unitOfWork, TimeProvider clock)
{
    public async Task ExecuteAsync(Guid reviewId, ReportReviewRequest request, CancellationToken ct = default)
    {
        Guid businessId = actor.RequireOwner();

        Review review = await reviews.GetOfBusinessAsync(businessId, reviewId, ct) ?? throw new DomainException("review.not_found");

        review.Report(actor.RequireUserId(), request.Reason, clock.GetUtcNow());
        await unitOfWork.SaveChangesAsync(ct);
    }
}

/// <summary>
/// As decisões do Admin. Ocultar tira a nota da média na mesma transação; reexibir devolve. Fica registrado quem decidiu,
/// quando e por quê.
/// </summary>
public sealed class ModerateReviewCommand(
    IReviewRepository reviews,
    IBusinessDirectory businesses,
    RatingAggregator aggregator,
    IActorContext actor,
    IUnitOfWork unitOfWork,
    TimeProvider clock)
{
    public async Task<ModerationReviewResponse> HideAsync(Guid reviewId, string? reason, CancellationToken ct = default)
    {
        Guid adminId = actor.RequirePlatformAdmin();
        Review review = await LoadAsync(reviewId, ct);

        review.Hide(adminId, reason ?? string.Empty, clock.GetUtcNow());
        await aggregator.RemoveAsync(review, ct);
        await unitOfWork.SaveChangesAsync(ct);

        return await ToResponseAsync(review, ct);
    }

    public async Task<ModerationReviewResponse> UnhideAsync(Guid reviewId, CancellationToken ct = default)
    {
        Guid adminId = actor.RequirePlatformAdmin();
        Review review = await LoadAsync(reviewId, ct);

        review.Unhide(adminId, clock.GetUtcNow());
        await aggregator.AddAsync(review, ct);
        await unitOfWork.SaveChangesAsync(ct);

        return await ToResponseAsync(review, ct);
    }

    public async Task<ModerationReviewResponse> DismissReportAsync(Guid reviewId, CancellationToken ct = default)
    {
        actor.RequirePlatformAdmin();
        Review review = await LoadAsync(reviewId, ct);

        review.DismissReport(clock.GetUtcNow());
        await unitOfWork.SaveChangesAsync(ct);

        return await ToResponseAsync(review, ct);
    }

    private async Task<Review> LoadAsync(Guid reviewId, CancellationToken ct) =>
        await reviews.GetByIdAsync(reviewId, ct) ?? throw new DomainException("review.not_found");

    private async Task<ModerationReviewResponse> ToResponseAsync(Review review, CancellationToken ct) =>
        ReviewConverter.ToModeration(review, (await businesses.GetContactInfoAsync(review.BusinessId, ct))?.Name ?? string.Empty);
}
