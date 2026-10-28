using System.Globalization;
using Booking.Application.Contracts.Identity;
using Booking.Application.Contracts.Notifications;
using Booking.Application.Contracts.People;
using Booking.Application.Contracts.Tenancy;
using Booking.Application.Module.Notifications.Email;

namespace Booking.Application.Module.Notifications.Integration;

/// <summary>
/// Quem recebe o quê quando um agendamento muda (Onda 5B). O consumidor recebe o andamento do próprio pedido; o dono
/// e o profissional (se tem login) recebem pedido novo e cancelamento pelo consumidor. Tudo vai para a outbox, no
/// mesmo <c>SaveChanges</c> da mudança.
/// </summary>
/// <remarks>
/// <b>Saúde (LGPD, Art. 11):</b> assunto e prévia não citam serviço, categoria nem o nome do estabelecimento — o nome
/// de uma clínica já diz a categoria, e o assunto aparece na lista de e-mails e na tela bloqueada. O corpo, enviado ao
/// próprio titular ou à equipe que o atende, traz os detalhes (ADR-021).
/// </remarks>
public sealed class AppointmentNotifier(
    IEmailOutbox outbox,
    NotificationSettings settings,
    IBusinessDirectory businesses,
    IPeopleDirectory people,
    IUserDirectory users,
    TimeProvider clock) : IAppointmentNotifier
{
    public async Task NotifyAsync(AppointmentFacts appointment, AppointmentChange change, CancellationToken ct = default)
    {
        BusinessContactInfo? business = await businesses.GetContactInfoAsync(appointment.BusinessId, ct);
        if (business is null)
        {
            return;
        }

        switch (change)
        {
            case AppointmentChange.Requested when appointment.Status == "Pending":
                await ToBusinessAsync(appointment, business, newRequest: true, ct);
                break;

            // Autoconfirmação: o pedido já nasce confirmado, e quem precisa saber é o consumidor.
            case AppointmentChange.Requested when appointment.Status == "Confirmed":
            case AppointmentChange.Confirmed:
                await ToCustomerAsync(appointment, business, AppointmentChange.Confirmed, ct);
                break;

            case AppointmentChange.Rejected:
            case AppointmentChange.CancelledByBusiness:
            case AppointmentChange.Expired:
                await ToCustomerAsync(appointment, business, change, ct);
                break;

            case AppointmentChange.CancelledByCustomer:
                await ToBusinessAsync(appointment, business, newRequest: false, ct);
                break;
        }
    }

    private async Task ToCustomerAsync(AppointmentFacts a, BusinessContactInfo business, AppointmentChange change, CancellationToken ct)
    {
        // Balcão sem conta: não há para quem mandar.
        if (a.CustomerId is not Guid customerId || await CustomerContactAsync(customerId, ct) is not (UserContact contact, string displayName))
        {
            return;
        }

        string when = EmailDates.Long(a.StartsAt, business.TimeZone);
        string shortWhen = EmailDates.Short(a.StartsAt, business.TimeZone);
        string? professional = (await people.GetProfessionalAsync(a.BusinessId, a.ProfessionalId, ct))?.DisplayName;
        string? mapUrl = MapUrl(business);

        (string subjectPrefix, string heading, string lead) = change switch
        {
            AppointmentChange.Confirmed => ("Horário confirmado", "Seu horário está confirmado", $"{business.Name} confirmou o seu horário."),
            AppointmentChange.Rejected => ("Pedido não aceito", "Seu pedido não foi aceito", $"{business.Name} não pôde aceitar o seu pedido."),
            AppointmentChange.CancelledByBusiness => ("Horário cancelado", "Seu horário foi cancelado", $"{business.Name} cancelou o seu horário."),
            _ => ("Pedido expirado", "Seu pedido expirou", $"{business.Name} não respondeu a tempo, e o horário foi liberado."),
        };

        string subject = a.IsSensitive ? $"{subjectPrefix} — {shortWhen}" : $"{subjectPrefix}: {business.Name}, {shortWhen}";
        string preheader = a.IsSensitive ? "Abra para ver os detalhes." : $"{a.ServiceName}, {when}.";

        List<string> paragraphs = [lead];
        if (!string.IsNullOrWhiteSpace(a.Reason) && change is AppointmentChange.Rejected or AppointmentChange.CancelledByBusiness)
        {
            paragraphs.Add($"Motivo informado: {a.Reason}");
        }

        if (change is not AppointmentChange.Confirmed)
        {
            paragraphs.Add("Você pode escolher outro horário quando quiser.");
        }

        List<EmailDetail> details = Details(a, business, when, professional, includeAddress: change is AppointmentChange.Confirmed);

        EmailAttachment? ics = change is AppointmentChange.Confirmed
            ? new EmailAttachment("agendamento.ics", IcsCalendar.ContentType, Ics(a, business, professional, mapUrl))
            : null;

        outbox.Enqueue(EmailLayout.Build(
            settings,
            contact.Email,
            displayName,
            subject,
            preheader,
            heading,
            paragraphs,
            details,
            action: change is AppointmentChange.Confirmed && mapUrl is not null ? new EmailAction("Ver no mapa", mapUrl) : null,
            attachment: ics));
    }

    private async Task ToBusinessAsync(AppointmentFacts a, BusinessContactInfo business, bool newRequest, CancellationToken ct)
    {
        List<Guid> recipients = [.. await businesses.ListActiveOwnerUserIdsAsync(a.BusinessId, ct)];

        ProfessionalInfo? professional = await people.GetProfessionalAsync(a.BusinessId, a.ProfessionalId, ct);
        if (professional?.MembershipId is Guid membershipId
            && await businesses.FindActiveMembershipUserIdAsync(a.BusinessId, membershipId, ct) is Guid professionalUser)
        {
            recipients.Add(professionalUser);
        }

        IReadOnlyList<UserContact> contacts = await users.GetActiveContactsAsync([.. recipients.Distinct()], ct);
        if (contacts.Count == 0)
        {
            return;
        }

        string? customer = a.CustomerId is Guid customerId ? (await CustomerContactAsync(customerId, ct))?.DisplayName : null;
        string when = EmailDates.Long(a.StartsAt, business.TimeZone);
        string shortWhen = EmailDates.Short(a.StartsAt, business.TimeZone);

        (string subject, string heading, string lead) = newRequest
            ? (a.IsSensitive ? $"Novo pedido aguardando resposta — {shortWhen}" : $"Novo pedido: {a.ServiceName}, {shortWhen}",
               "Novo pedido aguardando resposta",
               "Um consumidor pediu um horário. Confirme ou recuse antes que o pedido expire.")
            : (a.IsSensitive ? $"Agendamento cancelado — {shortWhen}" : $"Cancelamento: {a.ServiceName}, {shortWhen}",
               "Um agendamento foi cancelado",
               "O consumidor cancelou o agendamento, e o horário foi liberado.");

        List<EmailDetail> details = Details(a, business, when, professional?.DisplayName, includeAddress: false);
        if (customer is not null)
        {
            details.Insert(0, new EmailDetail("Consumidor", customer));
        }

        foreach (UserContact contact in contacts)
        {
            outbox.Enqueue(EmailLayout.Build(
                settings,
                contact.Email,
                contact.FullName,
                subject,
                preheader: a.IsSensitive ? "Abra o painel para ver os detalhes." : $"{a.ServiceName}, {when}.",
                heading,
                [lead],
                details,
                action: new EmailAction(newRequest ? "Abrir pedidos" : "Abrir agenda", settings.Link(newRequest ? "painel/pedidos" : "painel/agenda"))));
        }
    }

    private static List<EmailDetail> Details(AppointmentFacts a, BusinessContactInfo business, string when, string? professional, bool includeAddress)
    {
        List<EmailDetail> details = [new("Quando", when), new("Serviço", a.ServiceName)];

        if (professional is not null)
        {
            details.Add(new EmailDetail("Profissional", professional));
        }

        if (!string.IsNullOrWhiteSpace(a.AttendeeName))
        {
            details.Add(new EmailDetail("Atendimento para", a.AttendeeName));
        }

        details.Add(new EmailDetail("Onde", business.Name));

        if (includeAddress && !string.IsNullOrWhiteSpace(business.AddressLine))
        {
            details.Add(new EmailDetail("Endereço", business.AddressLine));
        }

        return details;
    }

    private string Ics(AppointmentFacts a, BusinessContactInfo business, string? professional, string? mapUrl)
    {
        // Em Saúde, o título do evento não cita o serviço: ele aparece no calendário e no alarme.
        string summary = a.IsSensitive ? $"Atendimento — {business.Name}" : $"{a.ServiceName} — {business.Name}";

        List<string> description = [];
        if (professional is not null)
        {
            description.Add($"Profissional: {professional}");
        }

        if (mapUrl is not null)
        {
            description.Add($"Mapa: {mapUrl}");
        }

        return IcsCalendar.Request(
            new IcsEvent(a.AppointmentId, a.StartsAt, a.EndsAt, summary, business.AddressLine, string.Join("\n", description), Sequence: 0),
            settings.BrandName,
            clock.GetUtcNow());
    }

    private static string? MapUrl(BusinessContactInfo business) =>
        business is { Latitude: double lat, Longitude: double lng }
            ? string.Create(CultureInfo.InvariantCulture, $"https://maps.google.com/?q={lat},{lng}")
            : null;

    private async Task<(UserContact Contact, string DisplayName)?> CustomerContactAsync(Guid customerId, CancellationToken ct)
    {
        CustomerIdentity? customer = (await people.GetCustomersAsync([customerId], ct)).FirstOrDefault();
        if (customer is null)
        {
            return null;
        }

        UserContact? contact = (await users.GetActiveContactsAsync([customer.UserId], ct)).FirstOrDefault();
        return contact is null ? null : (contact, customer.SocialName ?? contact.FullName);
    }
}
