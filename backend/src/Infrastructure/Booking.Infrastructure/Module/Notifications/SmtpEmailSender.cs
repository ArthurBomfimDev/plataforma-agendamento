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
        Configure(client, _options.Smtp);

        await client.ConnectAsync(Host, _options.Smtp.Port, SecurityFor(_options.Smtp), ct);

        if (!string.IsNullOrEmpty(_options.Smtp.User))
        {
            try
            {
                await client.AuthenticateAsync(_options.Smtp.User, _options.Smtp.Password ?? string.Empty, ct);
            }
            catch (AuthenticationException e)
            {
                // Vira falha comum da entrega: a outbox grava o texto em last_error e tenta de novo mais tarde.
                throw new InvalidOperationException(DescribeAuthenticationFailure(_options.Smtp, e.Message), e);
            }
        }

        await client.SendAsync(mime, ct);
        await client.DisconnectAsync(quit: true, ct);
    }

    /// <summary>
    /// Em <c>CheckCertificateRevocation = false</c> o MailKit não baixa CRL nem consulta OCSP, mas continua validando a
    /// cadeia e o nome do servidor. É o que destrava a saída que não alcança a CRL (ADR-021).
    /// </summary>
    public static void Configure(SmtpClient client, SmtpOptions smtp) =>
        client.CheckCertificateRevocation = smtp.CheckCertificateRevocation;

    /// <summary>
    /// Com TLS: implícito na 465, STARTTLS obrigatório nas demais (a 587 do Gmail). Obrigatório, e não "se o servidor
    /// oferecer" (<c>Auto</c>): quem estivesse no meio poderia tirar o STARTTLS da resposta e receber a senha em texto
    /// puro. Sem TLS: só o Mailpit local.
    /// </summary>
    public static SecureSocketOptions SecurityFor(SmtpOptions smtp) =>
        !smtp.UseSsl ? SecureSocketOptions.None
        : smtp.Port == 465 ? SecureSocketOptions.SslOnConnect
        : SecureSocketOptions.StartTls;

    /// <summary>
    /// O texto que vai para <c>last_error</c> quando o servidor recusa o login: host, porta e usuário, para quem
    /// diagnostica, e nunca a senha, nem se o servidor a devolvesse na resposta.
    /// </summary>
    public static string DescribeAuthenticationFailure(SmtpOptions smtp, string serverReply)
    {
        string reply = string.IsNullOrEmpty(smtp.Password) ? serverReply : serverReply.Replace(smtp.Password, "***", StringComparison.Ordinal);
        return $"SMTP recusou o login de {smtp.User} em {smtp.Host}:{smtp.Port}. Confira o usuário e a senha de app. Resposta: {reply}";
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
