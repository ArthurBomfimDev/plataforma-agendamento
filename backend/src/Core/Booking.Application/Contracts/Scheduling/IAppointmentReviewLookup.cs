namespace Booking.Application.Contracts.Scheduling;

/// <summary>
/// O que a avaliação precisa saber de um agendamento. <c>IsSensitive</c>: estabelecimento de Saúde (o serviço não vai para a
/// avaliação). <c>CompletedAt</c> só existe se o agendamento foi concluído.
/// </summary>
public sealed record AppointmentForReview(
    Guid Id,
    Guid BusinessId,
    Guid ProfessionalId,
    Guid? CustomerId,
    bool IsCompleted,
    DateTimeOffset? CompletedAt,
    string ServiceName,
    bool IsSensitive);

/// <summary>Superfície do Scheduling para o módulo Reputation (as fronteiras entre módulos passam por contrato).</summary>
public interface IAppointmentReviewLookup
{
    /// <summary>Em qualquer estabelecimento: quem avalia é o consumidor, que não tem tenant no token.</summary>
    Task<AppointmentForReview?> FindAsync(Guid appointmentId, CancellationToken ct = default);
}
