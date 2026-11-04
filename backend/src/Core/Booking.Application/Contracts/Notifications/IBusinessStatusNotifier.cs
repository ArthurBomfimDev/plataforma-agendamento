namespace Booking.Application.Contracts.Notifications;

/// <summary>O que mudou no status do estabelecimento, do ponto de vista de quem precisa ser avisado (o dono).</summary>
public enum BusinessStatusChange
{
    /// <summary>Enviado para análise (Saúde): o cadastro foi recebido.</summary>
    SubmittedForReview,
    Approved,
    /// <summary>Reprovado pelo Admin e devolvido ao rascunho, com o motivo.</summary>
    Rejected,
    Suspended,
    /// <summary>Publicado na hora (Beleza), sem análise.</summary>
    Published,
}

/// <summary>O estabelecimento como o Tenancy o conhece, sem expor a entidade a outro módulo.</summary>
public sealed record BusinessStatusFacts(Guid BusinessId, string Name, bool RequiresSensitiveHandling, string? Reason);

/// <summary>
/// Avisa os donos de uma mudança no status do estabelecimento. Só enfileira (<see cref="IEmailOutbox"/>): o aviso é
/// gravado no mesmo <c>SaveChanges</c> da mudança, que quem chama faz depois.
/// </summary>
public interface IBusinessStatusNotifier
{
    Task NotifyAsync(BusinessStatusFacts business, BusinessStatusChange change, CancellationToken ct = default);
}
