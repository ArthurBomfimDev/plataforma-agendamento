using Booking.Domain.Entity.Base;
using Booking.Domain.Entity.Module.Reputation;
using Booking.Domain.Enum.Module.Reputation;

namespace Booking.Domain.Interface.Repository.Module.Reputation;

public interface IReviewRepository
{
    /// <summary>A avaliação de um agendamento, em qualquer estabelecimento (o consumidor não tem tenant no token).</summary>
    Task<Review?> GetByAppointmentAsync(Guid appointmentId, CancellationToken ct = default);

    /// <summary>Públicas (não ocultas) de um estabelecimento, as mais recentes primeiro.</summary>
    Task<PagedResult<Review>> ListOfBusinessAsync(Guid businessId, PageRequest page, CancellationToken ct = default);

    /// <summary>Públicas (não ocultas) de um profissional.</summary>
    Task<PagedResult<Review>> ListOfProfessionalAsync(Guid professionalId, PageRequest page, CancellationToken ct = default);

    /// <summary>As avaliações que o consumidor fez.</summary>
    Task<PagedResult<Review>> ListOfCustomerAsync(Guid customerId, PageRequest page, CancellationToken ct = default);

    void Add(Review review);
}

public interface IRatingSummaryRepository
{
    /// <summary>Do alvo no estabelecimento informado, sem depender do token. Nulo se ainda não há nenhuma avaliação.</summary>
    Task<RatingSummary?> GetAsync(Guid businessId, RatingTarget target, Guid targetId, CancellationToken ct = default);

    void Add(RatingSummary summary);
}
