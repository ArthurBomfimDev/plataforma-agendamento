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

    Task<PagedResult<Appointment>> ListPendingAsync(Guid? professionalId, PageRequest page, CancellationToken ct = default);

    Task<PagedResult<Appointment>> ListForCustomerAsync(Guid customerId, PageRequest page, CancellationToken ct = default);

    /// <summary>Pendentes vencidos, de todos os estabelecimentos — usado só pela rotina de expiração.</summary>
    Task<IReadOnlyList<Appointment>> ListExpiredPendingAsync(DateTimeOffset now, int limit, CancellationToken ct = default);

    void Add(Appointment appointment);
}
