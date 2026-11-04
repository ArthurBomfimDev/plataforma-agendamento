using Booking.Application.Contracts.Notifications;
using Booking.Application.Contracts.Tenancy;
using Booking.Application.Module.Notifications.Email;

namespace Booking.Application.Module.Notifications.Integration;

/// <summary>
/// E-mail do convite de equipe. O token bruto só existe no link; a linha da outbox é limpa quando o envio dá certo.
/// A rota do frontend (HashRouter) é <c>#/convite?token=</c>. O texto cita o estabelecimento e o papel, nunca categoria
/// nem serviço.
/// </summary>
public sealed class InvitationMailer(IEmailOutbox outbox, NotificationSettings settings) : IInvitationMailer
{
    public Task QueueInvitationAsync(
        string email,
        string inviteeName,
        string businessName,
        string inviterName,
        string roleName,
        string rawToken,
        int validDays,
        CancellationToken ct = default)
    {
        string link = settings.Link($"convite?token={Uri.EscapeDataString(rawToken)}");
        string role = roleName == "Attendant" ? "atendente" : "profissional";

        outbox.Enqueue(EmailLayout.Build(
            settings,
            email,
            inviteeName,
            subject: $"Convite para a equipe de {businessName}",
            preheader: $"{inviterName} convidou você para a equipe.",
            heading: "Você foi convidado(a) para uma equipe",
            paragraphs:
            [
                $"{inviterName} convidou você para entrar na equipe de {businessName}, como {role}, no {settings.BrandName}.",
                $"O convite vale por {validDays} dias e só pode ser usado uma vez.",
                "Se você não esperava este convite, ignore este e-mail: nada acontece sem o seu aceite.",
            ],
            details: [],
            action: new EmailAction("Ver o convite", link)));

        return Task.CompletedTask;
    }
}
