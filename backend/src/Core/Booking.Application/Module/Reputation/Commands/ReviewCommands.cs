using Booking.Application.Common.Persistence;
using Booking.Application.Common.Tenancy;
using Booking.Application.Contracts.Identity;
using Booking.Application.Contracts.People;
using Booking.Application.Contracts.Scheduling;
using Booking.Application.Contracts.Tenancy;
using Booking.Application.Module.Reputation.Converter;
using Booking.Arguments.Module.Reputation;
using Booking.Domain.Entity.Module.Reputation;
using Booking.Domain.Enum.Module.Reputation;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.Reputation;

namespace Booking.Application.Module.Reputation.Commands;

/// <summary>
/// Mantém a média e a contagem na <b>mesma transação</b> da avaliação (ADR-032): quem chama grava tudo num
/// <c>SaveChanges</c>. Avaliação oculta pela moderação não conta.
/// </summary>
public sealed class RatingAggregator(IRatingSummaryRepository summaries)
{
    public async Task AddAsync(Review review, CancellationToken ct)
    {
        (await GetOrCreateAsync(review.BusinessId, RatingTarget.Business, review.BusinessId, ct)).Add(review.Rating);

        if (review.ProfessionalRating is int professional)
        {
            (await GetOrCreateAsync(review.BusinessId, RatingTarget.Professional, review.ProfessionalId, ct)).Add(professional);
        }
    }

    public async Task RemoveAsync(Review review, CancellationToken ct)
    {
        (await GetOrCreateAsync(review.BusinessId, RatingTarget.Business, review.BusinessId, ct)).Remove(review.Rating);

        if (review.ProfessionalRating is int professional)
        {
            (await GetOrCreateAsync(review.BusinessId, RatingTarget.Professional, review.ProfessionalId, ct)).Remove(professional);
        }
    }

    private async Task<RatingSummary> GetOrCreateAsync(Guid businessId, RatingTarget target, Guid targetId, CancellationToken ct)
    {
        RatingSummary? summary = await summaries.GetAsync(businessId, target, targetId, ct);

        if (summary is not null)
        {
            return summary;
        }

        summary = RatingSummary.Create(businessId, target, targetId);
        summaries.Add(summary);
        return summary;
    }
}

/// <summary>
/// Avaliar um agendamento concluído (ADR-032). Só o próprio consumidor, em contexto de consumidor (token de painel
/// recebe 403), uma vez por agendamento, até 30 dias depois de concluído. Dono e profissional do estabelecimento não
/// avaliam o próprio estabelecimento. Agendamento de outra pessoa responde como inexistente: não confirma que existe.
/// </summary>
public sealed class CreateReviewCommand(
    IReviewRepository reviews,
    IAppointmentReviewLookup appointments,
    IPeopleDirectory people,
    IUserDirectory users,
    IBusinessDirectory businesses,
    RatingAggregator aggregator,
    IActorContext actor,
    IUnitOfWork unitOfWork,
    TimeProvider clock)
{
    public async Task<MyReviewResponse> ExecuteAsync(Guid appointmentId, SaveReviewRequest request, CancellationToken ct = default)
    {
        Guid userId = actor.RequireUserId();

        // Conta única com troca de contexto: no painel de um estabelecimento a pessoa não avalia como consumidor.
        if (actor.BusinessId is not null)
        {
            throw new DomainException("appointment.customer_context_required");
        }

        AppointmentForReview appointment = await appointments.FindAsync(appointmentId, ct)
            ?? throw new DomainException("review.not_found");

        Guid customerId = await people.FindCustomerIdAsync(userId, ct)
            ?? throw new DomainException("review.not_found");

        if (appointment.CustomerId != customerId)
        {
            throw new DomainException("review.not_found");
        }

        if (await businesses.FindActiveMembershipAsync(appointment.BusinessId, userId, ct) is not null)
        {
            throw new DomainException("review.not_allowed");
        }

        DateTimeOffset now = clock.GetUtcNow();

        if (!appointment.IsCompleted || appointment.CompletedAt is not DateTimeOffset completedAt)
        {
            throw new DomainException("review.not_completed");
        }

        if (now > completedAt.AddDays(Review.ReviewWindowDays))
        {
            throw new DomainException("review.window_expired");
        }

        if (await reviews.GetByAppointmentAsync(appointmentId, ct) is not null)
        {
            throw new DomainException("review.already_reviewed");
        }

        Review review = Review.Create(
            appointment.BusinessId,
            appointment.Id,
            appointment.ProfessionalId,
            customerId,
            request.Rating,
            request.ProfessionalRating,
            request.Comment,
            await ReviewerNameAsync(userId, customerId, ct),
            appointment.ServiceName,
            appointment.IsSensitive,
            now);

        reviews.Add(review);
        await aggregator.AddAsync(review, ct);
        await unitOfWork.SaveChangesAsync(ct);

        return ReviewConverter.ToMine(review, now);
    }

    /// <summary>O nome social, se houver; senão o nome da conta. Sempre reduzido a "Ana S.".</summary>
    private async Task<string> ReviewerNameAsync(Guid userId, Guid customerId, CancellationToken ct)
    {
        IReadOnlyList<CustomerIdentity> customers = await people.GetCustomersAsync([customerId], ct);
        string? social = customers.FirstOrDefault()?.SocialName;

        if (!string.IsNullOrWhiteSpace(social))
        {
            return Review.DisplayNameOf(social);
        }

        IReadOnlyDictionary<Guid, string> names = await users.GetFullNamesAsync([userId], ct);
        return Review.DisplayNameOf(names.GetValueOrDefault(userId, string.Empty));
    }
}

/// <summary>
/// Editar a avaliação, uma única vez e em até 7 dias. Se a avaliação foi ocultada pela moderação, a média não muda
/// (ela já não conta).
/// </summary>
public sealed class UpdateReviewCommand(
    IReviewRepository reviews,
    IPeopleDirectory people,
    RatingAggregator aggregator,
    IActorContext actor,
    IUnitOfWork unitOfWork,
    TimeProvider clock)
{
    public async Task<MyReviewResponse> ExecuteAsync(Guid appointmentId, SaveReviewRequest request, CancellationToken ct = default)
    {
        Guid userId = actor.RequireUserId();

        if (actor.BusinessId is not null)
        {
            throw new DomainException("appointment.customer_context_required");
        }

        Guid customerId = await people.FindCustomerIdAsync(userId, ct) ?? throw new DomainException("review.not_found");

        Review review = await reviews.GetByAppointmentAsync(appointmentId, ct) ?? throw new DomainException("review.not_found");

        if (review.CustomerId != customerId)
        {
            throw new DomainException("review.not_found");
        }

        DateTimeOffset now = clock.GetUtcNow();

        // O que entrou na média sai com a nota velha e volta com a nova: tudo no mesmo SaveChanges.
        int oldRating = review.Rating;
        int? oldProfessional = review.ProfessionalRating;
        review.Edit(request.Rating, request.ProfessionalRating, request.Comment, now);

        if (!review.IsHidden)
        {
            await aggregator.RemoveAsync(SnapshotOf(review, oldRating, oldProfessional), ct);
            await aggregator.AddAsync(review, ct);
        }

        await unitOfWork.SaveChangesAsync(ct);
        return ReviewConverter.ToMine(review, now);
    }

    // As notas antigas, no formato que o agregador lê, sem mexer na avaliação que acabou de ser editada.
    private static Review SnapshotOf(Review current, int rating, int? professionalRating)
    {
        Review old = Review.Create(
            current.BusinessId, current.AppointmentId, current.ProfessionalId, current.CustomerId, rating, professionalRating,
            comment: null, current.ReviewerName, current.ServiceName, current.IsSensitive, current.ReviewedAt);
        return old;
    }
}
