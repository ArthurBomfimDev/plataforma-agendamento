using Booking.Domain.Entity.Base;
using Booking.Domain.Entity.Module.Scheduling;

namespace Booking.Domain.Interface.Repository.Module.Scheduling;

public interface IAppointmentRepository
{
    /// <summary>Do estabelecimento do token.</summary>
    Task<Appointment?> GetByIdAsync(Guid id, CancellationToken ct = default);

    /// <summary>Do próprio consumidor, em qualquer estabelecimento.</summary>
    Task<Appointment?> GetForCustomerAsync(Guid id, Guid customerId, CancellationToken ct = default);

    Task<Appointment?> FindByIdempotencyKeyAsync(Guid customerId, string idempotencyKey, CancellationToken ct = default);

    /// <summary>Agenda do estabelecimento do token no intervalo; um profissional ou todos.</summary>
    Task<PagedResult<Appointment>> ListInRangeAsync(DateTimeOffset fromUtc, DateTimeOffset toUtc, Guid? professionalId, PageRequest page, CancellationToken ct = default);

    /// <summary>
    /// <c>Pending</c> e <c>Confirmed</c> do estabelecimento do token cujo atendimento cruza o intervalo; um
    /// profissional ou todos. Sem rastreamento: só leitura.
    /// </summary>
    Task<PagedResult<Appointment>> ListActiveInRangeAsync(
        Guid? professionalId, DateTimeOffset fromUtc, DateTimeOffset toUtc, PageRequest page, CancellationToken ct = default);

    /// <summary>Os mesmos de <see cref="ListActiveInRangeAsync"/>, rastreados para mudança, até <paramref name="limit"/>.</summary>
    Task<IReadOnlyList<Appointment>> ListActiveInRangeForUpdateAsync(
        Guid? professionalId, DateTimeOffset fromUtc, DateTimeOffset toUtc, int limit, CancellationToken ct = default);

    Task<PagedResult<Appointment>> ListPendingAsync(Guid? professionalId, PageRequest page, CancellationToken ct = default);

    Task<PagedResult<Appointment>> ListForCustomerAsync(Guid customerId, PageRequest page, CancellationToken ct = default);

    /// <summary>Pendentes vencidos, de todos os estabelecimentos — usado só pela rotina de expiração.</summary>
    Task<IReadOnlyList<Appointment>> ListExpiredPendingAsync(DateTimeOffset now, int limit, CancellationToken ct = default);

    void Add(Appointment appointment);

    /// <summary>Esquece um agendamento ainda não gravado (e o histórico dele) — usado quando a gravação foi recusada.</summary>
    void Discard(Appointment appointment);
}
