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
/// <summary>O profissional não muda na edição: jornada de outra pessoa é outra linha.</summary>
public sealed record UpdateWorkScheduleRequest(
    DayOfWeek DayOfWeek,
    TimeOnly StartTime,
    TimeOnly EndTime,
    DateOnly EffectiveFrom,
    DateOnly? EffectiveTo);

/// <summary>
/// <c>ExistingAppointments</c>: <c>Keep</c> (padrão) mantém os agendamentos que caem no período; <c>CancelAll</c>
/// cancela todos, com <c>CancellationReason</c> obrigatório, na mesma transação do bloqueio. "Voltar e ajustar"
/// é não enviar: a tela usa a prévia (<c>affected-appointments</c>) antes de decidir.
/// </summary>
public sealed record AddScheduleExceptionRequest(
    Guid? ProfessionalId,
    string Kind,
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt,
    string? Reason,
    string? ExistingAppointments = null,
    string? CancellationReason = null);

/// <summary>Agendamento que cai no período de um bloqueio — a prévia que a tela mostra antes da escolha.</summary>
public sealed record AffectedAppointmentResponse(
    Guid Id,
    Guid ProfessionalId,
    string ServiceName,
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt,
    string Status,
    string? AttendeeName);

public sealed record WorkScheduleResponse(
    Guid Id,
    Guid ProfessionalId,
    DayOfWeek DayOfWeek,
    TimeOnly StartTime,
    TimeOnly EndTime,
    DateOnly EffectiveFrom,
    DateOnly? EffectiveTo);

/// <summary><c>CancelledAppointments</c>: quantos agendamentos o bloqueio cancelou ou recusou (0 com <c>Keep</c>).</summary>
public sealed record ScheduleExceptionResponse(
    Guid Id,
    Guid? ProfessionalId,
    string Kind,
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt,
    string? Reason,
    int CancelledAppointments = 0);

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
