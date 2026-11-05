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

    /// <summary>Por id, em qualquer estabelecimento: o Admin modera fora do tenant.</summary>
    Task<Review?> GetByIdAsync(Guid reviewId, CancellationToken ct = default);

    /// <summary>Por id, só dentro do estabelecimento: a de outro responde como inexistente.</summary>
    Task<Review?> GetOfBusinessAsync(Guid businessId, Guid reviewId, CancellationToken ct = default);

    /// <summary>Fila do Admin: denúncias abertas, as mais antigas primeiro.</summary>
    Task<PagedResult<Review>> ListWithOpenReportAsync(PageRequest page, CancellationToken ct = default);

    /// <summary>As ocultas, as mais recentes primeiro: o Admin pode reexibir.</summary>
    Task<PagedResult<Review>> ListHiddenAsync(PageRequest page, CancellationToken ct = default);

    void Add(Review review);
}

public interface IRatingSummaryRepository
{
    /// <summary>Do alvo no estabelecimento informado, sem depender do token. Nulo se ainda não há nenhuma avaliação.</summary>
    Task<RatingSummary?> GetAsync(Guid businessId, RatingTarget target, Guid targetId, CancellationToken ct = default);

    void Add(RatingSummary summary);
}
