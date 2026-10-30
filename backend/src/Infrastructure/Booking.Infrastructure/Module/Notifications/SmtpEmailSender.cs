using Booking.Application.Contracts.Notifications;
using Booking.Application.Module.Notifications.Email;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;

namespace Booking.Infrastructure.Module.Notifications;

/// <summary>
/// SMTP genérico (ADR-021): Resend, Brevo, Gmail com senha de app e o Mailpit local falam o mesmo protocolo, então o
/// provedor é só configuração. Uma conexão por envio; quem repete e espera é a outbox.
/// </summary>
public sealed class SmtpEmailSender(IOptions<EmailOptions> options) : IEmailSender
{
    // Host e From já foram validados na subida (ValidateOnStart): sem eles a API não sobe.
    private readonly EmailOptions _options = options.Value;
    private string Host => _options.Smtp.Host!;
    private string From => _options.From!;

    public async Task SendAsync(EmailMessage message, Guid deliveryId, CancellationToken ct = default)
    {
        using MimeMessage mime = Build(message, deliveryId);
        using var client = new SmtpClient();

        SecureSocketOptions security = _options.Smtp.UseSsl ? SecureSocketOptions.Auto : SecureSocketOptions.None;
        await client.ConnectAsync(Host, _options.Smtp.Port, security, ct);

        if (!string.IsNullOrEmpty(_options.Smtp.User))
        {
            await client.AuthenticateAsync(_options.Smtp.User, _options.Smtp.Password ?? string.Empty, ct);
        }

        await client.SendAsync(mime, ct);
        await client.DisconnectAsync(quit: true, ct);
    }

    private MimeMessage Build(EmailMessage message, Guid deliveryId)
    {
        var mime = new MimeMessage
        {
            Subject = message.Subject,

            // O mesmo em toda nova tentativa da mesma entrega: um reenvio depois de queda pode ser reconhecido.
            MessageId = $"{deliveryId}@{Domain(From)}",
        };
        mime.From.Add(new MailboxAddress(_options.FromName ?? string.Empty, From));
        mime.To.Add(new MailboxAddress(message.ToName ?? string.Empty, message.To));

        var body = new BodyBuilder { TextBody = message.TextBody, HtmlBody = message.HtmlBody };

        if (message.Attachment is EmailAttachment attachment)
        {
            body.Attachments.Add(attachment.FileName, System.Text.Encoding.UTF8.GetBytes(attachment.Content), ContentType.Parse(attachment.ContentType));
        }

        mime.Body = body.ToMessageBody();
        return mime;
    }

    private static string Domain(string address) => address[(address.IndexOf('@', StringComparison.Ordinal) + 1)..];
}
