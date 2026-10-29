namespace Booking.Arguments.Module.Scheduling;

/// <summary>
/// Pedido do consumidor. <c>AttendeeName</c>: quem será atendido, quando não é o titular da conta.
/// <c>IdempotencyKey</c>: gerada pelo cliente; repetir o envio devolve o mesmo agendamento.
/// </summary>
public sealed record RequestAppointmentRequest(
    Guid BusinessId,
    Guid ServiceId,
    Guid ProfessionalId,
    DateTimeOffset StartsAt,
    string? Notes,
    string? AttendeeName,
    string? IdempotencyKey);

public sealed record CounterAppointmentRequest(
    Guid ServiceId,
    Guid ProfessionalId,
    DateTimeOffset StartsAt,
    string WalkInName,
    string? WalkInPhone,
    string? Notes);

public sealed record ReasonRequest(string? Reason);

/// <summary>
/// <c>CustomerName</c>: só nas rotas do estabelecimento (agenda, pendentes, transições, balcão) — nome social do
/// consumidor, senão o do cadastro; no balcão, o nome informado. Nulo nas rotas do consumidor.
/// </summary>
public sealed record AppointmentResponse(
    Guid Id,
    Guid BusinessId,
    Guid ProfessionalId,
    Guid ServiceId,
    string ServiceName,
    int DurationMinutes,
    long PriceCents,
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt,
    string Status,
    string Source,
    DateTimeOffset? ExpiresAt,
    string? AttendeeName,
    string? CustomerNotes,
    string? CancellationReason,
    string? CancelledBy,
    DateTimeOffset RequestedAt,
    string? CustomerName = null);
