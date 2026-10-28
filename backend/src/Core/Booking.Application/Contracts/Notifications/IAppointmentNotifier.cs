namespace Booking.Application.Contracts.Notifications;

/// <summary>O que aconteceu com o agendamento, do ponto de vista de quem precisa ser avisado.</summary>
public enum AppointmentChange
{
    /// <summary>Pedido do consumidor. Pendente: avisa o estabelecimento. Já confirmado (autoconfirmação): avisa o consumidor.</summary>
    Requested,
    Confirmed,
    Rejected,
    CancelledByBusiness,
    CancelledByCustomer,
    Expired,
}

/// <summary>O agendamento como o Scheduling o conhece, sem expor a entidade a outro módulo.</summary>
public sealed record AppointmentFacts(
    Guid AppointmentId,
    Guid BusinessId,
    Guid ProfessionalId,
    Guid? CustomerId,
    string ServiceName,
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt,
    string Status,
    bool IsSensitive,
    string? AttendeeName,
    string? Reason);

/// <summary>
/// Avisa quem precisa saber de uma mudança no agendamento. Só enfileira (<see cref="IEmailOutbox"/>): o aviso é
/// gravado no mesmo <c>SaveChanges</c> da mudança, que quem chama faz depois.
/// </summary>
public interface IAppointmentNotifier
{
    Task NotifyAsync(AppointmentFacts appointment, AppointmentChange change, CancellationToken ct = default);
}
