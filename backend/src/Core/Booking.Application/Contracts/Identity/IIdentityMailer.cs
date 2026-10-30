namespace Booking.Application.Contracts.Identity;

/// <summary>
/// E-mails da conta. Só enfileira na outbox (ADR-021): quem chama grava o token e o e-mail no mesmo
/// <c>SaveChanges</c>, e o worker envia depois. O token bruto vai só no link do e-mail, nunca para o log.
/// </summary>
public interface IIdentityMailer
{
    Task QueueEmailConfirmationAsync(string email, string fullName, string rawToken, CancellationToken ct = default);

    Task QueuePasswordResetAsync(string email, string fullName, string rawToken, CancellationToken ct = default);
}
