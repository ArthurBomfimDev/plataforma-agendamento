using Booking.Arguments.Module.Availability;
using Booking.Domain.Entity.Module.Availability;

namespace Booking.Application.Module.Availability.Converter;

public static class AvailabilityConverter
{
    public static WorkScheduleResponse ToResponse(WorkSchedule s) =>
        new(s.Id, s.ProfessionalId, s.DayOfWeek, s.StartTime, s.EndTime, s.EffectiveFrom, s.EffectiveTo);

    public static ScheduleExceptionResponse ToResponse(ScheduleException e) =>
        new(e.Id, e.ProfessionalId, e.Kind.ToString(), e.StartsAt, e.EndsAt, e.Reason);
}
