namespace Booking.Domain.Enum.Module.Availability;

/// <summary><c>ExtraShift</c> soma disponibilidade (o sábado extra); os demais subtraem.</summary>
public enum ScheduleExceptionKind
{
    DayOff,
    Vacation,
    Block,
    ExtraShift,
}
