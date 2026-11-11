using Booking.Application.Contracts.Identity;
using Booking.Application.Contracts.Notifications;
using Booking.Application.Contracts.Tenancy;
using Booking.Application.Module.Notifications.Email;

namespace Booking.Application.Module.Notifications.Integration;

/// <summary>
/// Avisa os donos quando o status do estabelecimento muda (Fase 3): cadastro recebido, aprovado, reprovado com o motivo,
/// suspenso com o motivo e publicado. Vai para a outbox, no mesmo <c>SaveChanges</c> da mudança.
/// </summary>
/// <remarks>
/// <b>Saúde (LGPD, Art. 11):</b> assunto e prévia não citam serviço, categoria nem o nome do estabelecimento — o nome
/// de uma clínica já diz a categoria, e o assunto aparece na lista de e-mails e na tela bloqueada. O corpo, enviado ao
/// próprio dono, traz o nome. Nenhum e-mail cita serviço. O documento e o registro no conselho nunca entram.
/// </remarks>
public sealed class BusinessStatusNotifier(
    IEmailOutbox outbox,
    NotificationSettings settings,
    IBusinessDirectory businesses,
    IUserDirectory users) : IBusinessStatusNotifier
{
    public async Task NotifyAsync(BusinessStatusFacts business, BusinessStatusChange change, CancellationToken ct = default)
    {
        IReadOnlyList<Guid> owners = await businesses.ListActiveOwnerUserIdsAsync(business.BusinessId, ct);
        IReadOnlyList<UserContact> contacts = await users.GetActiveContactsAsync([.. owners], ct);

        if (contacts.Count == 0)
        {
            return;
        }

        (string subject, string heading, List<string> paragraphs, string? actionLabel) = Content(business, change);

        // Em Saúde o assunto não leva o nome; fora dela, leva.
        string subjectLine = business.RequiresSensitiveHandling ? subject : $"{subject}: {business.Name}";
        string preheader = business.RequiresSensitiveHandling ? "Abra para ver os detalhes." : heading;

        foreach (UserContact contact in contacts)
        {
            outbox.Enqueue(EmailLayout.Build(
                settings,
                contact.Email,
                contact.FullName,
                subjectLine,
                preheader,
                heading,
                paragraphs,
                [],
                action: actionLabel is null ? null : new EmailAction(actionLabel, settings.Link("panel"))));
        }
    }

    private static (string Subject, string Heading, List<string> Paragraphs, string? ActionLabel) Content(
        BusinessStatusFacts b, BusinessStatusChange change)
    {
        string reason = string.IsNullOrWhiteSpace(b.Reason) ? string.Empty : $"Motivo: {b.Reason}";

        return change switch
        {
            BusinessStatusChange.SubmittedForReview => (
                "Recebemos o seu cadastro",
                "Cadastro recebido para análise",
                [
                    $"Recebemos o cadastro de {b.Name}. Um administrador vai conferir os dados.",
                    "Enquanto isso você pode configurar o estabelecimento, mas ele ainda não aparece na plataforma nem recebe pedidos.",
                ],
                "Abrir o painel"),

            BusinessStatusChange.Approved => (
                "Seu estabelecimento foi aprovado",
                "Seu estabelecimento foi aprovado",
                [$"{b.Name} foi aprovado e já aparece na plataforma."],
                "Abrir o painel"),

            BusinessStatusChange.Rejected => (
                "Seu cadastro precisa de ajustes",
                "Seu cadastro não foi aprovado",
                Paragraphs($"O cadastro de {b.Name} não foi aprovado.", reason, "Corrija o que foi apontado e envie de novo."),
                "Abrir o painel"),

            BusinessStatusChange.Suspended => (
                "Seu estabelecimento foi suspenso",
                "Seu estabelecimento foi suspenso",
                Paragraphs($"{b.Name} foi suspenso e deixou de aparecer na plataforma.", reason),
                null),

            _ => (
                "Seu estabelecimento foi publicado",
                "Seu estabelecimento foi publicado",
                [$"{b.Name} já aparece na plataforma e pode receber pedidos."],
                "Abrir o painel"),
        };
    }

    private static List<string> Paragraphs(params string[] lines) => [.. lines.Where(l => l.Length > 0)];
}
