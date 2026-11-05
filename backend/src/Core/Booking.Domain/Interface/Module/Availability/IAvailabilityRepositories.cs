using Booking.Domain.Entity.Base;
using Booking.Domain.Entity.Module.Availability;

namespace Booking.Domain.Interface.Repository.Module.Availability;

public interface IWorkScheduleRepository
{
    Task<WorkSchedule?> GetByIdAsync(Guid id, CancellationToken ct = default);

    Task<PagedResult<WorkSchedule>> ListForProfessionalAsync(Guid professionalId, PageRequest page, CancellationToken ct = default);

    /// <summary>Jornada de um profissional num estabelecimento informado explicitamente (cálculo público de horários).</summary>
    Task<IReadOnlyList<WorkSchedule>> ListOfProfessionalAsync(Guid businessId, Guid professionalId, CancellationToken ct = default);

    Task<bool> AnyOfBusinessAsync(Guid businessId, CancellationToken ct = default);

    void Add(WorkSchedule schedule);

    void Remove(WorkSchedule schedule);
}

public interface IScheduleExceptionRepository
{
    Task<ScheduleException?> GetByIdAsync(Guid id, CancellationToken ct = default);

    Task<PagedResult<ScheduleException>> ListUpcomingAsync(DateTimeOffset fromUtc, PageRequest page, CancellationToken ct = default);

    /// <summary>Exceções do profissional ou do estabelecimento inteiro que cruzam o intervalo.</summary>
    Task<IReadOnlyList<ScheduleException>> ListOverlappingAsync(
        Guid businessId, Guid professionalId, DateTimeOffset fromUtc, DateTimeOffset toUtc, CancellationToken ct = default);

    void Add(ScheduleException exception);

    void Remove(ScheduleException exception);
}
