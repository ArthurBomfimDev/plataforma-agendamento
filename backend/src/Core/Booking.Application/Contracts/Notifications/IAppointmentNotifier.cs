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

    /// <summary>Atendimento concluído: o consumidor recebe o convite para avaliar ("Como foi?", ADR-032).</summary>
    Completed,
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
/// <summary>Os dois lembretes ao consumidor (C1): 24 h antes e 1 h antes.</summary>
public enum AppointmentReminder
{
    DayBefore,
    HourBefore,
}

public interface IAppointmentNotifier
{
    Task NotifyAsync(AppointmentFacts appointment, AppointmentChange change, CancellationToken ct = default);

    /// <summary>
    /// Quantos lembretes ainda cabem no orçamento de e-mail das últimas 24 h. <b>Só o lembrete consulta isto</b>: nenhum outro
    /// aviso (confirmação, redefinição de senha, convite…) passa por aqui nem é contido por ele.
    /// </summary>
    Task<int> ReminderBudgetLeftAsync(CancellationToken ct = default);

    /// <summary>Enfileira o lembrete ao consumidor. Falso se não há para quem mandar (balcão sem conta, conta inativa).</summary>
    Task<bool> NotifyReminderAsync(AppointmentFacts appointment, AppointmentReminder reminder, CancellationToken ct = default);
}
