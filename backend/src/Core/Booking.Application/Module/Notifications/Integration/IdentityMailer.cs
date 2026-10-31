using Booking.Application.Contracts.Identity;
using Booking.Application.Contracts.Notifications;
using Booking.Application.Module.Notifications.Email;

namespace Booking.Application.Module.Notifications.Integration;

/// <summary>
/// E-mails da conta (confirmação e redefinição de senha), enfileirados na outbox. O token bruto só existe no link do
/// e-mail; a linha da outbox é limpa quando o envio dá certo.
/// </summary>
/// <remarks>Rotas do frontend em HashRouter: <c>#/confirmar-email?token=</c> e <c>#/redefinir-senha?token=</c>.</remarks>
public sealed class IdentityMailer(IEmailOutbox outbox, NotificationSettings settings) : IIdentityMailer
{
    public Task QueueEmailConfirmationAsync(string email, string fullName, string rawToken, CancellationToken ct = default)
    {
        string link = settings.Link($"confirmar-email?token={Uri.EscapeDataString(rawToken)}");

        outbox.Enqueue(EmailLayout.Build(
            settings,
            email,
            fullName,
            subject: $"Confirme seu e-mail — {settings.BrandName}",
            preheader: "Falta um passo para ativar sua conta.",
            heading: "Confirme seu e-mail",
            paragraphs: [$"Você criou uma conta no {settings.BrandName}. Confirme que este e-mail é seu.", "O link vale por tempo limitado e só pode ser usado uma vez."],
            details: [],
            action: new EmailAction("Confirmar e-mail", link)));

        return Task.CompletedTask;
    }

    public Task QueuePasswordResetAsync(string email, string fullName, string rawToken, CancellationToken ct = default)
    {
        string link = settings.Link($"redefinir-senha?token={Uri.EscapeDataString(rawToken)}");

        outbox.Enqueue(EmailLayout.Build(
            settings,
            email,
            fullName,
            subject: $"Redefinição de senha — {settings.BrandName}",
            preheader: "Pedido de nova senha para a sua conta.",
            heading: "Redefinir a senha",
            paragraphs:
            [
                "Recebemos um pedido para redefinir a senha da sua conta.",
                "Se não foi você, ignore este e-mail: a senha atual continua valendo.",
            ],
            details: [],
            action: new EmailAction("Criar nova senha", link)));

        return Task.CompletedTask;
    }
}
