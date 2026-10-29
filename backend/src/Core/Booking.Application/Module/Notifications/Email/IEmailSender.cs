using Booking.Application.Contracts.Notifications;

namespace Booking.Application.Module.Notifications.Email;

/// <summary>
/// Porta de envio (ADR-021). O adaptador de produção fala SMTP genérico; o provedor (Resend, Brevo, Gmail…) é só
/// configuração. Só o worker da outbox chama isto — nunca uma requisição.
/// </summary>
public interface IEmailSender
{
    /// <param name="deliveryId">Id da linha da outbox; vira o <c>Message-ID</c>, o mesmo em toda nova tentativa.</param>
    Task SendAsync(EmailMessage message, Guid deliveryId, CancellationToken ct = default);
}
