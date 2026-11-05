using Booking.Application.Contracts.Identity;
using Booking.Application.Contracts.Notifications;
using Booking.Application.Contracts.Tenancy;
using Booking.Application.Module.Notifications.Email;
using Booking.Application.Module.Notifications.Integration;

namespace Booking.UnitTests.Notifications;

/// <summary>Os e-mails de status do estabelecimento ao dono (Fase 3): quem recebe, o motivo e o que a Saúde não cita.</summary>
public sealed class BusinessStatusNotifierTests
{
    private static readonly Guid _businessId = Guid.NewGuid();
    private static readonly Guid _ownerId = Guid.NewGuid();
    private readonly CapturingOutbox _outbox = new();

    private BusinessStatusNotifier Notifier(params UserContact[] owners) =>
        new(_outbox, new NotificationSettings("Vagoo", "https://app.exemplo.test"), new FakeBusinesses(owners), new FakeUsers(owners));

    private static UserContact Owner() => new(_ownerId, "dono@exemplo.test", "Dono de Teste");

    [Fact]
    public async Task Rejection_tells_the_owner_the_reason_and_how_to_fix_it_without_naming_the_clinic_in_the_subject()
    {
        var facts = new BusinessStatusFacts(_businessId, "Clínica Vida", RequiresSensitiveHandling: true, Reason: "Registro do conselho não confere.");

        await Notifier(Owner()).NotifyAsync(facts, BusinessStatusChange.Rejected);

        EmailMessage message = Assert.Single(_outbox.Sent);
        Assert.Equal("dono@exemplo.test", message.To);
        Assert.DoesNotContain("Clínica Vida", message.Subject);
        Assert.DoesNotContain("Clínica Vida", message.Preheader);
        Assert.Contains("Motivo: Registro do conselho não confere.", message.TextBody);
        Assert.Contains("Corrija o que foi apontado", message.TextBody);
        Assert.Contains("https://app.exemplo.test/#/panel", message.TextBody + message.HtmlBody);
    }

    [Fact]
    public async Task Health_review_received_never_cites_service_category_or_the_name_in_subject_and_preview()
    {
        var facts = new BusinessStatusFacts(_businessId, "Clínica Vida", RequiresSensitiveHandling: true, Reason: null);

        await Notifier(Owner()).NotifyAsync(facts, BusinessStatusChange.SubmittedForReview);

        EmailMessage message = Assert.Single(_outbox.Sent);
        foreach (string forbidden in new[] { "Clínica", "Saúde", "Saude", "psic", "serviço" })
        {
            Assert.DoesNotContain(forbidden, message.Subject, StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain(forbidden, message.Preheader, StringComparison.OrdinalIgnoreCase);
        }

        Assert.Contains("ainda não aparece na plataforma", message.TextBody);
    }

    [Fact]
    public async Task Suspension_carries_the_reason_and_no_action_button()
    {
        var facts = new BusinessStatusFacts(_businessId, "Studio Silva", RequiresSensitiveHandling: false, Reason: "Denúncia procedente.");

        await Notifier(Owner()).NotifyAsync(facts, BusinessStatusChange.Suspended);

        EmailMessage message = Assert.Single(_outbox.Sent);
        Assert.Contains("Studio Silva", message.Subject); // fora de Saúde, o assunto leva o nome
        Assert.Contains("Motivo: Denúncia procedente.", message.TextBody);
        Assert.DoesNotContain("Abrir o painel", message.TextBody);
    }

    [Theory]
    [InlineData(BusinessStatusChange.Approved, "foi aprovado")]
    [InlineData(BusinessStatusChange.Published, "já aparece na plataforma")]
    public async Task Approval_and_publication_confirm_that_the_business_is_live(BusinessStatusChange change, string expected)
    {
        var facts = new BusinessStatusFacts(_businessId, "Studio Silva", RequiresSensitiveHandling: false, Reason: null);

        await Notifier(Owner()).NotifyAsync(facts, change);

        Assert.Contains(expected, Assert.Single(_outbox.Sent).TextBody);
    }

    [Fact]
    public async Task Without_an_active_owner_nothing_is_enqueued()
    {
        await Notifier().NotifyAsync(new BusinessStatusFacts(_businessId, "Studio Silva", false, null), BusinessStatusChange.Approved);

        Assert.Empty(_outbox.Sent);
    }

    private sealed class CapturingOutbox : IEmailOutbox
    {
        public List<EmailMessage> Sent { get; } = [];

        public void Enqueue(EmailMessage message) => Sent.Add(message);
    }

    private sealed class FakeBusinesses(UserContact[] owners) : IBusinessDirectory
    {
        public Task<IReadOnlyList<Guid>> ListActiveOwnerUserIdsAsync(Guid businessId, CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyList<Guid>>([.. owners.Select(o => o.UserId)]);

        public Task<BusinessContactInfo?> GetContactInfoAsync(Guid businessId, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<Guid?> FindActiveMembershipUserIdAsync(Guid businessId, Guid membershipId, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<BusinessMembershipInfo?> FindActiveMembershipAsync(Guid businessId, Guid userId, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<IReadOnlyList<UserBusinessInfo>> ListActiveBusinessesOfUserAsync(Guid userId, int limit, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<BusinessSchedulingInfo?> GetSchedulingInfoAsync(Guid businessId, CancellationToken ct = default) => throw new NotSupportedException();
    }

    private sealed class FakeUsers(UserContact[] owners) : IUserDirectory
    {
        public Task<IReadOnlyDictionary<Guid, string>> GetFullNamesAsync(IReadOnlyCollection<Guid> userIds, CancellationToken ct = default) =>
            throw new NotSupportedException();

        public Task<IReadOnlyList<UserContact>> GetActiveContactsAsync(IReadOnlyCollection<Guid> userIds, CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyList<UserContact>>([.. owners.Where(o => userIds.Contains(o.UserId))]);
    }
}
