using Booking.Application.Common.Tenancy;
using Booking.Application.Contracts.People;
using Booking.Application.Contracts.Tenancy;
using Booking.Application.Module.Reputation.Converter;
using Booking.Arguments.Module.Reputation;
using Booking.Domain.Entity.Base;
using Booking.Domain.Entity.Module.Reputation;
using Booking.Domain.Enum.Module.Reputation;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.Reputation;

namespace Booking.Application.Module.Reputation.Queries;

/// <summary>Avaliações públicas de um estabelecimento ativo, paginadas, as mais recentes primeiro. Ocultas ficam de fora.</summary>
public sealed class ListBusinessReviewsQuery(IReviewRepository reviews, IBusinessDirectory businesses)
{
    public async Task<PagedResult<PublicReviewResponse>> ExecuteAsync(Guid businessId, PageRequest page, CancellationToken ct = default)
    {
        await PublicTarget.EnsureBusinessAsync(businesses, businessId, ct);

        PagedResult<Review> result = await reviews.ListOfBusinessAsync(businessId, page, ct);
        return new PagedResult<PublicReviewResponse>([.. result.Items.Select(ReviewConverter.ToPublic)], result.Page, result.PageSize, result.TotalCount);
    }
}

/// <summary>Avaliações públicas de um profissional ativo (as que trazem a nota dele ou não), paginadas.</summary>
public sealed class ListProfessionalReviewsQuery(IReviewRepository reviews, IPeopleDirectory people, IBusinessDirectory businesses)
{
    public async Task<PagedResult<PublicReviewResponse>> ExecuteAsync(Guid professionalId, PageRequest page, CancellationToken ct = default)
    {
        await PublicTarget.EnsureProfessionalAsync(people, businesses, professionalId, ct);

        PagedResult<Review> result = await reviews.ListOfProfessionalAsync(professionalId, page, ct);
        return new PagedResult<PublicReviewResponse>([.. result.Items.Select(ReviewConverter.ToPublic)], result.Page, result.PageSize, result.TotalCount);
    }
}

public sealed class GetBusinessRatingQuery(IRatingSummaryRepository summaries, IBusinessDirectory businesses)
{
    public async Task<RatingSummaryResponse> ExecuteAsync(Guid businessId, CancellationToken ct = default)
    {
        await PublicTarget.EnsureBusinessAsync(businesses, businessId, ct);

        return ReviewConverter.ToSummary(await summaries.GetAsync(businessId, RatingTarget.Business, businessId, ct));
    }
}

/// <summary>Nota do profissional: só entram as avaliações em que o consumidor deu a nota dele.</summary>
public sealed class GetProfessionalRatingQuery(IRatingSummaryRepository summaries, IPeopleDirectory people, IBusinessDirectory businesses)
{
    public async Task<RatingSummaryResponse> ExecuteAsync(Guid professionalId, CancellationToken ct = default)
    {
        Guid businessId = await PublicTarget.EnsureProfessionalAsync(people, businesses, professionalId, ct);

        return ReviewConverter.ToSummary(await summaries.GetAsync(businessId, RatingTarget.Professional, professionalId, ct));
    }
}

/// <summary>"Minhas avaliações": o consumidor vê as que fez (a tela usa para mostrar "Avaliar" ou "Avaliado").</summary>
public sealed class ListMyReviewsQuery(IReviewRepository reviews, IPeopleDirectory people, IActorContext actor, TimeProvider clock)
{
    public async Task<PagedResult<MyReviewResponse>> ExecuteAsync(PageRequest page, CancellationToken ct = default)
    {
        Guid userId = actor.RequireUserId();

        Guid? customerId = await people.FindCustomerIdAsync(userId, ct);

        if (customerId is null)
        {
            return new PagedResult<MyReviewResponse>([], page.Page, page.PageSize, 0);
        }

        PagedResult<Review> result = await reviews.ListOfCustomerAsync(customerId.Value, page, ct);
        DateTimeOffset now = clock.GetUtcNow();

        return new PagedResult<MyReviewResponse>(
            [.. result.Items.Select(r => ReviewConverter.ToMine(r, now))], result.Page, result.PageSize, result.TotalCount);
    }
}

/// <summary>A avaliação de um agendamento do consumidor, para a gaveta de editar. De outra pessoa: 404.</summary>
public sealed class GetMyReviewQuery(IReviewRepository reviews, IPeopleDirectory people, IActorContext actor, TimeProvider clock)
{
    public async Task<MyReviewResponse> ExecuteAsync(Guid appointmentId, CancellationToken ct = default)
    {
        Guid userId = actor.RequireUserId();

        Guid customerId = await people.FindCustomerIdAsync(userId, ct) ?? throw new DomainException("review.not_found");
        Review review = await reviews.GetByAppointmentAsync(appointmentId, ct) ?? throw new DomainException("review.not_found");

        return review.CustomerId == customerId ? ReviewConverter.ToMine(review, clock.GetUtcNow()) : throw new DomainException("review.not_found");
    }
}

/// <summary>Só se avalia e se lê o que o público vê: estabelecimento ativo, profissional ativo. O resto responde 404.</summary>
internal static class PublicTarget
{
    public static async Task EnsureBusinessAsync(IBusinessDirectory businesses, Guid businessId, CancellationToken ct)
    {
        BusinessSchedulingInfo? info = await businesses.GetSchedulingInfoAsync(businessId, ct);

        if (info is not { IsBookable: true })
        {
            throw new DomainException("business.not_found");
        }
    }

    public static async Task<Guid> EnsureProfessionalAsync(IPeopleDirectory people, IBusinessDirectory businesses, Guid professionalId, CancellationToken ct)
    {
        Guid businessId = await people.FindActiveProfessionalBusinessAsync(professionalId, ct)
            ?? throw new DomainException("professional.not_found");

        BusinessSchedulingInfo? info = await businesses.GetSchedulingInfoAsync(businessId, ct);

        return info is { IsBookable: true } ? businessId : throw new DomainException("professional.not_found");
    }
}
