using Booking.Application.Contracts.Availability;
using Booking.Application.Contracts.Scheduling;
using Booking.Application.Contracts.Tenancy;
using Booking.Domain.DomainService.Module.Availability;
using Booking.Domain.Entity.Module.Availability;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.Availability;
using Booking.Domain.ValueObject;

namespace Booking.Application.Module.Availability.Integration;

/// <summary>Reúne os dados de que o <see cref="AvailabilityCalculator"/> precisa; o cálculo em si é puro.</summary>
public sealed class AvailabilityService(
    IWorkScheduleRepository schedules,
    IScheduleExceptionRepository exceptions,
    IBusinessDirectory businesses,
    IAgendaOccupancy agenda,
    TimeProvider clock) : IAvailabilityService
{
    public async Task<IReadOnlyList<DateTimeOffset>> GetSlotStartsAsync(SlotQuery q, CancellationToken ct = default)
    {
        BusinessSchedulingInfo business = await businesses.GetSchedulingInfoAsync(q.BusinessId, ct)
            ?? throw new DomainException("business.not_found");

        TimeZoneInfo zone = TimeZoneInfo.FindSystemTimeZoneById(business.TimeZone);

        // Janela larga o bastante para pegar exceções e agendamentos que cruzam a meia-noite local.
        DateTimeOffset from = new DateTimeOffset(q.Date.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero).AddDays(-1);
        DateTimeOffset to = from.AddDays(3);

        IReadOnlyList<WorkSchedule> professionalSchedules = await schedules.ListOfProfessionalAsync(q.BusinessId, q.ProfessionalId, ct);
        IReadOnlyList<ScheduleException> overlapping = await exceptions.ListOverlappingAsync(q.BusinessId, q.ProfessionalId, from, to, ct);
        IReadOnlyList<BlockedRange> blocked = await agenda.GetBlockedRangesAsync(q.BusinessId, q.ProfessionalId, from, to, ct);

        return AvailabilityCalculator.Calculate(new AvailabilityRequest(
            q.ProfessionalId,
            q.Date,
            zone,
            professionalSchedules,
            overlapping,
            [.. blocked.Select(b => TimeRange.Of(b.Start, b.End))],
            q.DurationMinutes,
            q.BufferBeforeMinutes,
            q.BufferAfterMinutes,
            q.SlotStepMinutes,
            clock.GetUtcNow(),
            business.MinLeadTimeHours,
            business.BookingHorizonDays,
            q.IgnoreLeadTime));
    }

    public Task<bool> HasWorkScheduleAsync(Guid businessId, CancellationToken ct = default) =>
        schedules.AnyOfBusinessAsync(businessId, ct);
}
