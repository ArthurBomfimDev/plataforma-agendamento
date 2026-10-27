using Booking.Domain.Entity.Base;

namespace Booking.Application.Contracts.Scheduling;

/// <summary>Agendamento que cai dentro de um bloqueio de agenda: o que o dono vê antes de decidir.</summary>
public sealed record AffectedAppointment(
    Guid Id,
    Guid ProfessionalId,
    string ServiceName,
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt,
    string Status,
    string? AttendeeName);

/// <summary>
/// Superfície do Scheduling para o bloqueio de período (folga, férias, bloqueio). Vale para o estabelecimento do
/// token; sem profissional, para todos os profissionais dele. Afetado é o agendamento <c>Pending</c> ou
/// <c>Confirmed</c> cujo atendimento cruza o período.
/// </summary>
public interface IAffectedAppointments
{
    /// <summary>Prévia, sem mudar nada. Registra a leitura de agendamento sensível (LGPD, Art. 11).</summary>
    Task<PagedResult<AffectedAppointment>> ListAsync(
        Guid? professionalId, DateTimeOffset fromUtc, DateTimeOffset toUtc, PageRequest page, CancellationToken ct = default);

    /// <summary>
    /// Aplica o cancelamento pelo estabelecimento a todos os afetados — confirmado vira <c>Cancelled</c>, pendente
    /// vira <c>Rejected</c> —, <b>sem gravar</b>. Quem chama grava junto com o bloqueio, numa transação só: ou tudo
    /// entra, ou nada entra. Devolve quantos foram tocados.
    /// </summary>
    Task<int> StageCancellationAsync(
        Guid? professionalId, DateTimeOffset fromUtc, DateTimeOffset toUtc, string reason, CancellationToken ct = default);
}
