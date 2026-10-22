namespace Booking.Arguments.Module.Availability;

/// <summary>Horários no fuso do estabelecimento (ex.: "09:00"). Dia: Sunday…Saturday.</summary>
public sealed record AddWorkScheduleRequest(
    Guid ProfessionalId,
    DayOfWeek DayOfWeek,
    TimeOnly StartTime,
    TimeOnly EndTime,
    DateOnly EffectiveFrom,
    DateOnly? EffectiveTo);

/// <summary><c>Kind</c>: DayOff, Vacation, Block ou ExtraShift. Sem profissional, vale para o estabelecimento inteiro.</summary>
public sealed record AddScheduleExceptionRequest(
    Guid? ProfessionalId,
    string Kind,
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt,
    string? Reason);

public sealed record WorkScheduleResponse(
    Guid Id,
    Guid ProfessionalId,
    DayOfWeek DayOfWeek,
    TimeOnly StartTime,
    TimeOnly EndTime,
    DateOnly EffectiveFrom,
    DateOnly? EffectiveTo);

public sealed record ScheduleExceptionResponse(
    Guid Id,
    Guid? ProfessionalId,
    string Kind,
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt,
    string? Reason);

/// <summary>Horários livres de um dia. <c>Holiday</c> preenchido quando a data é feriado nacional, mesmo que haja horário.</summary>
public sealed record AvailableSlotsResponse(
    Guid ProfessionalId,
    Guid ServiceId,
    DateOnly Date,
    string TimeZone,
    string? Holiday,
    IReadOnlyList<DateTimeOffset> Slots);

/// <summary>
/// Um dia do calendário da vitrine. <c>Works</c>: o profissional tem jornada neste dia (falso = fechado).
/// <c>SlotCount</c> zero com <c>Works</c> verdadeiro = dia aberto e lotado.
/// </summary>
public sealed record AvailabilityDayResponse(DateOnly Date, bool Works, int SlotCount, string? Holiday);

/// <summary>Resumo de vários dias numa chamada, para o calendário não pedir dia a dia.</summary>
public sealed record AvailabilityCalendarResponse(
    Guid ProfessionalId,
    Guid ServiceId,
    string TimeZone,
    IReadOnlyList<AvailabilityDayResponse> Days);
