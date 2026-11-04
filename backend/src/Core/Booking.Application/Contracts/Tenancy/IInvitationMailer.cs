namespace Booking.Application.Contracts.Tenancy;

/// <summary>Enfileira o e-mail do convite na outbox (ADR-021), na mesma transação do convite.</summary>
public interface IInvitationMailer
{
    /// <param name="roleName"><c>Professional</c> ou <c>Attendant</c>.</param>
    /// <param name="rawToken">Só existe aqui e no link do e-mail; o banco guarda o hash.</param>
    Task QueueInvitationAsync(
        string email,
        string inviteeName,
        string businessName,
        string inviterName,
        string roleName,
        string rawToken,
        int validDays,
        CancellationToken ct = default);
}
