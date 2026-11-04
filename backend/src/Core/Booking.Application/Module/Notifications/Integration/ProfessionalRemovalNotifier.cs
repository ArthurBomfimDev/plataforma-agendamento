using Booking.Application.Contracts.Identity;
using Booking.Application.Contracts.Notifications;
using Booking.Application.Contracts.Tenancy;
using Booking.Application.Module.Notifications.Email;

namespace Booking.Application.Module.Notifications.Integration;

/// <summary>
/// Avisa os donos quando alguém pede a remoção do perfil de um profissional (ADR-031). Vai para a outbox, no mesmo
/// <c>SaveChanges</c> do pedido.
/// </summary>
/// <remarks>
/// <b>Saúde (LGPD, Art. 11):</b> assunto e prévia não citam o profissional nem o estabelecimento; o corpo, enviado só ao
/// dono, traz o nome e o motivo. O contato de quem pediu, se informado, só aparece no corpo.
/// </remarks>
public sealed class ProfessionalRemovalNotifier(
    IEmailOutbox outbox,
    NotificationSettings settings,
    IBusinessDirectory businesses,
    IUserDirectory users) : IProfessionalRemovalNotifier
{
    public async Task NotifyAsync(ProfessionalRemovalFacts request, CancellationToken ct = default)
    {
        IReadOnlyList<Guid> owners = await businesses.ListActiveOwnerUserIdsAsync(request.BusinessId, ct);
        IReadOnlyList<UserContact> contacts = await users.GetActiveContactsAsync([.. owners], ct);

        if (contacts.Count == 0)
        {
            return;
        }

        string subject = request.RequiresSensitiveHandling
            ? "Pedido de remoção de um perfil"
            : $"Pedido de remoção do perfil de {request.ProfessionalName}";

        List<string> paragraphs =
        [
            $"Alguém pediu a remoção do perfil público de {request.ProfessionalName}.",
            $"Motivo informado: {request.Reason}",
        ];

        if (!string.IsNullOrWhiteSpace(request.Contact))
        {
            paragraphs.Add($"Contato deixado por quem pediu: {request.Contact}");
        }

        paragraphs.Add("Para atender, desative o profissional em Profissionais: ele sai da vitrine na hora. O pedido também está na fila da administração.");

        foreach (UserContact contact in contacts)
        {
            outbox.Enqueue(EmailLayout.Build(
                settings,
                contact.Email,
                contact.FullName,
                subject,
                preheader: "Abra para ver o pedido.",
                heading: "Pedido de remoção de perfil",
                paragraphs,
                [],
                action: new EmailAction("Abrir Profissionais", settings.Link("panel/professionals"))));
        }
    }
}
