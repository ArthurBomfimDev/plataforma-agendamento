namespace Booking.Application.Contracts.Identity;

<<<<<<< HEAD
=======
/// <summary>
/// Porta de envio dos e-mails de Identity. Sem adaptador real no MVP inicial: a implementação
/// atual só registra no log. O Outbox (ADR-010, decisão 7) entra quando houver provedor de e-mail.
/// </summary>
>>>>>>> 072927b623995e9cdf1f2a39df62404aca1719cf
public interface IIdentityMailer
{
    Task SendEmailConfirmationAsync(string email, string rawToken, CancellationToken ct = default);
    Task SendPasswordResetAsync(string email, string rawToken, CancellationToken ct = default);
}
