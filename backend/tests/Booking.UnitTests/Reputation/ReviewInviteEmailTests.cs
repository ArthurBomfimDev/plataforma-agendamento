using Booking.Application.Contracts.Identity;
using Booking.Application.Contracts.Notifications;
using Booking.Application.Contracts.People;
using Booking.Application.Contracts.Tenancy;
using Booking.Application.Module.Notifications.Email;
using Booking.Application.Module.Notifications.Integration;

namespace Booking.UnitTests.Reputation;

/// <summary>O "Como foi?" depois da conclusão (ADR-032): vai ao consumidor, sem nome nem serviço em Saúde.</summary>
public sealed class ReviewInviteEmailTests
{
    private static readonly Guid _customerId = Guid.NewGuid();
    private static readonly Guid _userId = Guid.NewGuid();
    private static readonly DateTimeOffset _startsAt = new(2026, 11, 3, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public async Task Completed_appointment_invites_the_customer_to_review_with_a_link_to_the_appointments()
    {
        Outbox outbox = new();

        await Notifier(outbox).NotifyAsync(Facts(sensitive: false), AppointmentChange.Completed);

        EmailMessage mail = Assert.Single(outbox.Sent);
        Assert.Equal("ana@example.com", mail.To);
        Assert.Equal("Como foi? Avalie Barbearia do Zé", mail.Subject);
        Assert.Contains("Corte masculino", mail.HtmlBody);
        Assert.Contains("https://app.example/#/appointments", mail.HtmlBody);
        Assert.Contains("30 dias", mail.TextBody);
        Assert.Null(mail.Attachment);
    }

    [Fact]
    public async Task Health_invite_does_not_name_the_business_or_the_service_anywhere()
    {
        Outbox outbox = new();

        await Notifier(outbox).NotifyAsync(Facts(sensitive: true), AppointmentChange.Completed);

        EmailMessage mail = Assert.Single(outbox.Sent);
        Assert.Equal("Como foi o seu atendimento?", mail.Subject);
        Assert.DoesNotContain("Barbearia do Zé", mail.Subject);
        Assert.DoesNotContain("Barbearia do Zé", mail.Preheader);
        Assert.DoesNotContain("Barbearia do Zé", mail.HtmlBody);
        Assert.DoesNotContain("Barbearia do Zé", mail.TextBody);
        Assert.DoesNotContain("Corte masculino", mail.HtmlBody);
        Assert.DoesNotContain("Corte masculino", mail.TextBody);
        Assert.Contains("não escreva dados de saúde", mail.TextBody);
    }

    [Fact]
    public async Task Counter_appointment_without_account_receives_nothing()
    {
        Outbox outbox = new();

        await Notifier(outbox).NotifyAsync(Facts(sensitive: false) with { CustomerId = null }, AppointmentChange.Completed);

        Assert.Empty(outbox.Sent);
    }

    private static AppointmentNotifier Notifier(Outbox outbox) =>
        new(outbox, new NotificationSettings("Vagoo", "https://app.example"), new Businesses(), new People(), new Users(), TimeProvider.System);

    private static AppointmentFacts Facts(bool sensitive) =>
        new(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), _customerId, "Corte masculino", _startsAt, _startsAt.AddMinutes(30), "Completed", sensitive, null, null);

    private sealed class Outbox : IEmailOutbox
    {
        public List<EmailMessage> Sent { get; } = [];

        public void Enqueue(EmailMessage message) => Sent.Add(message);
    }

    private sealed class Businesses : IBusinessDirectory
    {
        public Task<BusinessContactInfo?> GetContactInfoAsync(Guid businessId, CancellationToken ct = default) =>
            Task.FromResult<BusinessContactInfo?>(new(businessId, "Barbearia do Zé", "Rua A, 1", null, null, "America/Sao_Paulo", false));

        public Task<IReadOnlyList<Guid>> ListActiveOwnerUserIdsAsync(Guid businessId, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<Guid?> FindActiveMembershipUserIdAsync(Guid businessId, Guid membershipId, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<BusinessMembershipInfo?> FindActiveMembershipAsync(Guid businessId, Guid userId, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<IReadOnlyList<UserBusinessInfo>> ListActiveBusinessesOfUserAsync(Guid userId, int limit, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<BusinessSchedulingInfo?> GetSchedulingInfoAsync(Guid businessId, CancellationToken ct = default) => throw new NotSupportedException();
    }

    private sealed class People : IPeopleDirectory
    {
        public Task<ProfessionalInfo?> GetProfessionalAsync(Guid businessId, Guid professionalId, CancellationToken ct = default) =>
            Task.FromResult<ProfessionalInfo?>(null);

        public Task<Guid?> FindActiveProfessionalBusinessAsync(Guid professionalId, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<int> CountActiveProfessionalsAsync(Guid businessId, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<Guid?> FindProfessionalIdByMembershipAsync(Guid businessId, Guid membershipId, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<Guid?> FindCustomerIdAsync(Guid userId, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<IReadOnlyList<CustomerIdentity>> GetCustomersAsync(IReadOnlyCollection<Guid> customerIds, CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyList<CustomerIdentity>>(customerIds.Contains(_customerId) ? [new CustomerIdentity(_customerId, _userId, null)] : []);
    }

    private sealed class Users : IUserDirectory
    {
        public Task<IReadOnlyDictionary<Guid, string>> GetFullNamesAsync(IReadOnlyCollection<Guid> userIds, CancellationToken ct = default) =>
            throw new NotSupportedException();

        public Task<IReadOnlyList<UserContact>> GetActiveContactsAsync(IReadOnlyCollection<Guid> userIds, CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyList<UserContact>>(userIds.Contains(_userId) ? [new UserContact(_userId, "ana@example.com", "Ana Souza")] : []);
    }
}
