namespace Booking.Application.Contracts.Compliance;

/// <summary>Superfície pública do módulo Compliance (LGPD, Art. 11).</summary>
public interface IComplianceGateway
{
    /// <summary>Verdadeiro se o usuário tem consentimento vigente, na versão atual, para agendar em categoria sensível.</summary>
    Task<bool> HasSensitiveSchedulingConsentAsync(Guid userId, CancellationToken ct = default);

    /// <summary>Registra a leitura de um agendamento de categoria sensível. Não salva: entra na transação de quem chamou.</summary>
    void LogSensitiveAccess(Guid businessId, Guid actorUserId, Guid appointmentId, string action, DateTimeOffset now);
}
