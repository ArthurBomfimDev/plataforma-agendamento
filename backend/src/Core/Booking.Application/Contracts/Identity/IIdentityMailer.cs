namespace Booking.Application.Contracts.Identity;

/// <summary>
/// Porta de envio dos e-mails de Identity. Sem adaptador real no MVP inicial: a implementação
/// atual só registra no log. O Outbox (ADR-010, decisão 7) entra quando houver provedor de e-mail.
/// </summary>
public interface IIdentityMailer
{
    Task SendEmailConfirmationAsync(string email, string rawToken, CancellationToken ct = default);
    Task SendPasswordResetAsync(string email, string rawToken, CancellationToken ct = default);
}
