using Booking.Application.Common.Tenancy;
using Booking.Application.Contracts.Identity;
using Booking.Application.Contracts.People;
using Booking.Application.Contracts.Tenancy;
using Booking.Application.Module.Identity.Integration;
using Booking.Application.Module.Tenancy.Commands;
using Booking.Arguments.Module.Tenancy;
using Booking.Domain.Entity.Base;
using Booking.Domain.Entity.Module.Identity;
using Booking.Domain.Entity.Module.Tenancy;
using Booking.Domain.Enum.Module.Tenancy;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.Tenancy;
using Booking.Domain.ValueObject;
using Booking.Infrastructure.Module.Identity.Security;
using Booking.UnitTests.Identity;

namespace Booking.UnitTests.Tenancy;

/// <summary>Convite de equipe (Fase 4, bloco 1): a regra do domínio e os comandos, sem banco.</summary>
public sealed class BusinessInvitationTests
{
    private static readonly DateTimeOffset _now = new(2026, 11, 4, 12, 0, 0, TimeSpan.Zero);

    // --- Domínio ---

    [Fact]
    public void An_invitation_is_pending_for_7_days_then_expires()
    {
        var invitation = BusinessInvitation.Create(Guid.NewGuid(), "Ana@Exemplo.com", " Ana ", BusinessMembershipRole.Professional, null, Guid.NewGuid(), "hash", _now);

        Assert.Equal("ana@exemplo.com", invitation.Email);
        Assert.Equal("Ana", invitation.InviteeName);
        Assert.Equal(InvitationState.Pending, invitation.StateAt(_now.AddDays(7).AddTicks(-1)));
        Assert.Equal(InvitationState.Expired, invitation.StateAt(_now.AddDays(7)));
    }

    [Fact]
    public void An_owner_cannot_be_invited_and_an_attendant_has_no_professional_profile()
    {
        Assert.Equal("invitation.cannot_invite_as_owner", Assert.Throws<DomainException>(() =>
            BusinessInvitation.Create(Guid.NewGuid(), "a@b.com", "A", BusinessMembershipRole.Owner, null, Guid.NewGuid(), "h", _now)).Message);
        Assert.Equal("invitation.attendant_has_no_professional", Assert.Throws<DomainException>(() =>
            BusinessInvitation.Create(Guid.NewGuid(), "a@b.com", "A", BusinessMembershipRole.Attendant, Guid.NewGuid(), Guid.NewGuid(), "h", _now)).Message);
    }

    [Fact]
    public void Accepting_marks_the_invitation_used_and_a_second_accept_is_refused()
    {
        BusinessInvitation invitation = NewInvitation(BusinessMembershipRole.Professional);

        invitation.Accept(Guid.NewGuid(), termsAccepted: true, _now);

        Assert.Equal(InvitationState.Accepted, invitation.StateAt(_now));
        Assert.Equal(BusinessInvitation.ProfessionalTermsVersion, invitation.TermsVersion);
        Assert.Equal(_now, invitation.TermsAcceptedAt);
        Assert.Equal("invitation.already_used", Assert.Throws<DomainException>(() => invitation.Accept(Guid.NewGuid(), true, _now)).Message);
    }

    [Fact]
    public void A_professional_must_accept_the_terms_but_an_attendant_does_not()
    {
        Assert.Equal("invitation.terms_required", Assert.Throws<DomainException>(() =>
            NewInvitation(BusinessMembershipRole.Professional).Accept(Guid.NewGuid(), termsAccepted: false, _now)).Message);

        BusinessInvitation attendant = NewInvitation(BusinessMembershipRole.Attendant);
        attendant.Accept(Guid.NewGuid(), termsAccepted: false, _now);

        Assert.Null(attendant.TermsVersion);
    }

    [Fact]
    public void Revoked_and_expired_invitations_cannot_be_accepted()
    {
        BusinessInvitation revoked = NewInvitation(BusinessMembershipRole.Attendant);
        revoked.Revoke(_now);
        Assert.Equal("invitation.revoked", Assert.Throws<DomainException>(() => revoked.Accept(Guid.NewGuid(), true, _now)).Message);

        BusinessInvitation expired = NewInvitation(BusinessMembershipRole.Attendant);
        Assert.Equal("invitation.expired", Assert.Throws<DomainException>(() => expired.Accept(Guid.NewGuid(), true, _now.AddDays(8))).Message);
    }

    [Fact]
    public void Resending_replaces_the_token_and_the_deadline_but_not_after_accepted_or_revoked()
    {
        BusinessInvitation invitation = NewInvitation(BusinessMembershipRole.Attendant);

        invitation.Resend("novo-hash", _now.AddDays(8));

        Assert.Equal("novo-hash", invitation.TokenHash);
        Assert.Equal(InvitationState.Pending, invitation.StateAt(_now.AddDays(9)));

        invitation.Revoke(_now.AddDays(9));
        Assert.Equal("invitation.cannot_resend_from_current_state", Assert.Throws<DomainException>(() => invitation.Resend("x", _now.AddDays(9))).Message);
    }

    [Fact]
    public void A_removed_member_can_rejoin_but_an_active_one_cannot()
    {
        var membership = BusinessMembership.CreateAccepted(Guid.NewGuid(), Guid.NewGuid(), BusinessMembershipRole.Professional, _now);
        Assert.Equal("business_membership.cannot_rejoin_from_current_status", Assert.Throws<DomainException>(() => membership.Rejoin(BusinessMembershipRole.Attendant, _now)).Message);

        membership.Remove(_now);
        membership.Rejoin(BusinessMembershipRole.Attendant, _now.AddDays(1));

        Assert.Equal(BusinessMembershipStatus.Active, membership.Status);
        Assert.Equal(BusinessMembershipRole.Attendant, membership.Role);
        Assert.Null(membership.RemovedAt);
    }

    [Fact]
    public void A_new_business_starts_with_15_seats() =>
        Assert.Equal(15, Business.Create("Studio", Document.Of("11.222.333/0001-81"), BusinessCategory.Beleza).SeatLimit);

    // --- Comandos ---

    [Fact]
    public async Task The_owner_invites_and_the_email_carries_a_raw_token_while_only_the_hash_is_stored()
    {
        var world = new World();

        InvitationResponse response = await world.Invite("nova@exemplo.com", "Professional");

        BusinessInvitation stored = Assert.Single(world.Invitations.Items);
        (string Email, string Role, string RawToken) sent = Assert.Single(world.Mailer.Sent);
        Assert.Equal("Pending", response.State);
        Assert.Equal("nova@exemplo.com", sent.Email);
        Assert.NotEqual(sent.RawToken, stored.TokenHash);
        Assert.Equal(world.Tokens.Hash(sent.RawToken), stored.TokenHash);
    }

    [Theory]
    [InlineData("Professional")]
    [InlineData("Attendant")]
    [InlineData(null)]
    public async Task Only_the_owner_invites_resends_and_revokes(string? role)
    {
        var world = new World();
        await world.Invite("nova@exemplo.com", "Attendant");
        Guid id = world.Invitations.Items[0].Id;
        world.ActorRole = role;

        Assert.Equal("auth.forbidden", (await Assert.ThrowsAsync<DomainException>(() => world.Invite("outra@exemplo.com", "Attendant"))).Message);
        Assert.Equal("auth.forbidden", (await Assert.ThrowsAsync<DomainException>(() => world.Resend().ExecuteAsync(id))).Message);
        Assert.Equal("auth.forbidden", (await Assert.ThrowsAsync<DomainException>(() => world.Revoke().ExecuteAsync(id))).Message);
        Assert.Equal("auth.forbidden", (await Assert.ThrowsAsync<DomainException>(() => world.Seats().ExecuteAsync())).Message);
    }

    [Fact]
    public async Task The_seat_limit_counts_accounts_and_pending_invitations_and_revoking_frees_a_seat()
    {
        var world = new World();
        world.Business.SetSeatLimit(3); // o dono + 2

        await world.Invite("a@exemplo.com", "Attendant");
        await world.Invite("b@exemplo.com", "Attendant");

        Assert.Equal("business.seat_limit_reached", (await Assert.ThrowsAsync<DomainException>(() => world.Invite("c@exemplo.com", "Attendant"))).Message);
        Assert.Equal(new SeatsResponse(3, 3), await world.Seats().ExecuteAsync());

        await world.Revoke().ExecuteAsync(world.Invitations.Items[0].Id);
        await world.Invite("c@exemplo.com", "Attendant");

        Assert.Equal(3, world.Invitations.Items.Count);
    }

    [Fact]
    public async Task An_expired_invitation_does_not_hold_a_seat_but_resending_it_needs_one()
    {
        var world = new World();
        world.Business.SetSeatLimit(2); // o dono + 1
        await world.Invite("a@exemplo.com", "Attendant");
        Guid id = world.Invitations.Items[0].Id;

        world.Clock.Now = _now.AddDays(8); // expirou: a vaga está livre
        await world.Invite("b@exemplo.com", "Attendant");

        Assert.Equal("business.seat_limit_reached", (await Assert.ThrowsAsync<DomainException>(() => world.Resend().ExecuteAsync(id))).Message);
    }

    [Fact]
    public async Task Duplicate_pending_invitations_for_the_same_email_and_existing_members_are_refused()
    {
        var world = new World();
        await world.Invite("a@exemplo.com", "Attendant");

        Assert.Equal("invitation.already_pending", (await Assert.ThrowsAsync<DomainException>(() => world.Invite("A@Exemplo.com", "Professional"))).Message);

        Guid memberId = await world.Accounts.CreateConfirmedAccountAsync("membro@exemplo.com", "Membro", "senha-correta-123");
        world.Memberships.Items.Add(BusinessMembership.CreateAccepted(world.Business.Id, memberId, BusinessMembershipRole.Professional, _now));

        Assert.Equal("invitation.already_member", (await Assert.ThrowsAsync<DomainException>(() => world.Invite("membro@exemplo.com", "Attendant"))).Message);
    }

    [Theory]
    [InlineData("Owner")]
    [InlineData("Admin")]
    [InlineData("")]
    public async Task Only_professional_and_attendant_can_be_invited(string role) =>
        Assert.Equal("invitation.role_invalid", (await Assert.ThrowsAsync<DomainException>(() => new World().Invite("a@exemplo.com", role))).Message);

    [Fact]
    public async Task A_professional_invitation_can_only_link_an_existing_unlinked_profile()
    {
        var world = new World();
        Guid free = world.Linker.AddProfile(linked: false);
        Guid taken = world.Linker.AddProfile(linked: true);

        await world.Invite("a@exemplo.com", "Professional", free);

        Assert.Equal("invitation.professional_not_linkable", (await Assert.ThrowsAsync<DomainException>(() => world.Invite("b@exemplo.com", "Professional", taken))).Message);
        Assert.Equal("invitation.professional_not_linkable", (await Assert.ThrowsAsync<DomainException>(() => world.Invite("c@exemplo.com", "Professional", Guid.NewGuid()))).Message);
        Assert.Equal("invitation.attendant_has_no_professional", (await Assert.ThrowsAsync<DomainException>(() => world.Invite("d@exemplo.com", "Attendant", free))).Message);
    }

    [Fact]
    public async Task Accepting_with_a_new_account_creates_a_confirmed_account_the_membership_and_the_profile()
    {
        var world = new World();
        await world.Invite("nova@exemplo.com", "Professional");
        string raw = world.Mailer.Sent[0].RawToken;

        AcceptedInvitationResponse accepted = await world.AcceptNew().ExecuteAsync(
            new AcceptInvitationNewAccountRequest(raw, "Nova Pessoa", "senha-correta-123", AcceptTerms: true));

        User user = Assert.Single(world.Users.Items);
        BusinessMembership membership = Assert.Single(world.Memberships.Items, x => x.UserId == user.Id);
        Assert.NotNull(user.EmailConfirmedAt); // o e-mail do convite já conta como confirmado
        Assert.Equal(BusinessMembershipRole.Professional, membership.Role);
        Assert.Equal(BusinessMembershipStatus.Active, membership.Status);
        Assert.Equal(membership.Id, Assert.Single(world.Linker.Created).MembershipId);
        Assert.Equal("Studio Silva", accepted.BusinessName);
        Assert.Equal("Professional", accepted.Role);
    }

    [Fact]
    public async Task A_used_token_is_refused_and_an_unknown_token_looks_like_not_found()
    {
        var world = new World();
        await world.Invite("nova@exemplo.com", "Attendant");
        string raw = world.Mailer.Sent[0].RawToken;
        await world.AcceptNew().ExecuteAsync(new AcceptInvitationNewAccountRequest(raw, "Nova", "senha-correta-123", false));

        Assert.Equal("invitation.already_used", (await Assert.ThrowsAsync<DomainException>(() =>
            world.AcceptNew().ExecuteAsync(new AcceptInvitationNewAccountRequest(raw, "Nova", "senha-correta-123", false)))).Message);
        Assert.Equal("invitation.not_found", (await Assert.ThrowsAsync<DomainException>(() =>
            world.Preview().ExecuteAsync(new InvitationTokenRequest("token-que-nao-existe")))).Message);
        Assert.Equal("invitation.not_found", (await Assert.ThrowsAsync<DomainException>(() =>
            world.Preview().ExecuteAsync(new InvitationTokenRequest("")))).Message);
    }

    [Fact]
    public async Task The_professional_terms_block_the_acceptance_and_nothing_is_created()
    {
        var world = new World();
        await world.Invite("nova@exemplo.com", "Professional");

        Assert.Equal("invitation.terms_required", (await Assert.ThrowsAsync<DomainException>(() =>
            world.AcceptNew().ExecuteAsync(new AcceptInvitationNewAccountRequest(world.Mailer.Sent[0].RawToken, "Nova", "senha-correta-123", AcceptTerms: false)))).Message);

        Assert.Equal(1, world.Unit.Saves); // só o salvamento do convite; o aceite não gravou
    }

    [Fact]
    public async Task A_logged_in_user_with_a_different_email_cannot_use_the_link()
    {
        var world = new World();
        await world.Invite("convidada@exemplo.com", "Attendant");
        Guid other = await world.Accounts.CreateConfirmedAccountAsync("outra@exemplo.com", "Outra", "senha-correta-123");
        await world.Accounts.CreateConfirmedAccountAsync("convidada@exemplo.com", "Convidada", "senha-correta-123");
        world.ActorUserId = other;

        Assert.Equal("invitation.email_mismatch", (await Assert.ThrowsAsync<DomainException>(() =>
            world.Accept().ExecuteAsync(new AcceptInvitationRequest(world.Mailer.Sent[0].RawToken, AcceptTerms: true)))).Message);
        Assert.DoesNotContain(world.Memberships.Items, x => x.UserId == other);
    }

    [Fact]
    public async Task A_user_with_the_invited_email_accepts_logged_in_and_an_existing_account_cannot_use_the_new_account_route()
    {
        var world = new World();
        await world.Invite("convidada@exemplo.com", "Attendant");
        string raw = world.Mailer.Sent[0].RawToken;
        Guid userId = await world.Accounts.CreateConfirmedAccountAsync("convidada@exemplo.com", "Convidada", "senha-correta-123");

        Assert.Equal("invitation.account_exists", (await Assert.ThrowsAsync<DomainException>(() =>
            world.AcceptNew().ExecuteAsync(new AcceptInvitationNewAccountRequest(raw, "Convidada", "senha-correta-123", false)))).Message);

        world.ActorUserId = userId;
        AcceptedInvitationResponse accepted = await world.Accept().ExecuteAsync(new AcceptInvitationRequest(raw, AcceptTerms: false));

        Assert.Equal("Attendant", accepted.Role);
        Assert.Equal(BusinessMembershipRole.Attendant, Assert.Single(world.Memberships.Items, x => x.UserId == userId).Role);
        Assert.Empty(world.Linker.Created); // atendente não tem perfil de profissional
    }

    [Fact]
    public async Task Accepting_links_the_existing_profile_instead_of_creating_one()
    {
        var world = new World();
        Guid profile = world.Linker.AddProfile(linked: false);
        await world.Invite("nova@exemplo.com", "Professional", profile);

        await world.AcceptNew().ExecuteAsync(new AcceptInvitationNewAccountRequest(world.Mailer.Sent[0].RawToken, "Nova", "senha-correta-123", true));

        Assert.Empty(world.Linker.Created);
        Assert.Equal(profile, Assert.Single(world.Linker.Linked).ProfessionalId);
    }

    [Fact]
    public async Task Resending_invalidates_the_old_link_and_revoking_blocks_the_new_one()
    {
        var world = new World();
        await world.Invite("nova@exemplo.com", "Attendant");
        string oldRaw = world.Mailer.Sent[0].RawToken;
        Guid id = world.Invitations.Items[0].Id;

        await world.Resend().ExecuteAsync(id);
        string newRaw = world.Mailer.Sent[1].RawToken;

        Assert.Equal("invitation.not_found", (await Assert.ThrowsAsync<DomainException>(() => world.Preview().ExecuteAsync(new InvitationTokenRequest(oldRaw)))).Message);
        Assert.Equal("nova@exemplo.com", (await world.Preview().ExecuteAsync(new InvitationTokenRequest(newRaw))).Email);

        await world.Revoke().ExecuteAsync(id);

        Assert.Equal("invitation.revoked", (await Assert.ThrowsAsync<DomainException>(() => world.Preview().ExecuteAsync(new InvitationTokenRequest(newRaw)))).Message);
    }

    [Fact]
    public async Task An_expired_link_says_expired_and_a_removed_member_rejoins_with_the_new_role()
    {
        var world = new World();
        Guid userId = await world.Accounts.CreateConfirmedAccountAsync("volta@exemplo.com", "Volta", "senha-correta-123");
        var former = BusinessMembership.CreateAccepted(world.Business.Id, userId, BusinessMembershipRole.Professional, _now);
        former.Remove(_now);
        world.Memberships.Items.Add(former);

        await world.Invite("volta@exemplo.com", "Attendant");
        string raw = world.Mailer.Sent[0].RawToken;

        world.Clock.Now = _now.AddDays(8);
        Assert.Equal("invitation.expired", (await Assert.ThrowsAsync<DomainException>(() => world.Preview().ExecuteAsync(new InvitationTokenRequest(raw)))).Message);

        await world.Resend().ExecuteAsync(world.Invitations.Items[0].Id);
        world.ActorUserId = userId;
        await world.Accept().ExecuteAsync(new AcceptInvitationRequest(world.Mailer.Sent[1].RawToken, AcceptTerms: false));

        Assert.Equal(BusinessMembershipStatus.Active, former.Status);
        Assert.Equal(BusinessMembershipRole.Attendant, former.Role);
        Assert.Equal(2, world.Memberships.Items.Count); // o dono e quem voltou: o vínculo antigo foi reaproveitado
    }

    [Fact]
    public async Task The_owner_of_another_business_cannot_see_resend_or_revoke_this_invitation()
    {
        var world = new World();
        await world.Invite("nova@exemplo.com", "Attendant");
        Guid id = world.Invitations.Items[0].Id;
        world.ActorBusinessId = Guid.NewGuid(); // dono de outro estabelecimento

        Assert.Equal("invitation.not_found", (await Assert.ThrowsAsync<DomainException>(() => world.Revoke().ExecuteAsync(id))).Message);
        Assert.Equal("invitation.not_found", (await Assert.ThrowsAsync<DomainException>(() => world.Resend().ExecuteAsync(id))).Message);
    }

    private static BusinessInvitation NewInvitation(BusinessMembershipRole role) =>
        BusinessInvitation.Create(Guid.NewGuid(), "ana@exemplo.com", "Ana", role, null, Guid.NewGuid(), "hash", _now);

    /// <summary>O estabelecimento, o dono e os repositórios em memória. O "tenant" do token é <see cref="ActorBusinessId"/>.</summary>
    private sealed class World
    {
        public Business Business { get; } = Business.Create("Studio Silva", Document.Of("11.222.333/0001-81"), BusinessCategory.Beleza);
        public MutableClock Clock { get; } = new(_now);
        public ISecureTokenGenerator Tokens { get; } = new SecureTokenGenerator();
        public InMemoryUsers Users { get; } = new();
        public FakeMemberships Memberships { get; }
        public FakeInvitations Invitations { get; }
        public FakeLinker Linker { get; } = new();
        public RecordingInvitationMailer Mailer { get; } = new();
        public CountingUnit Unit { get; } = new();
        public AccountProvisioner Accounts { get; }

        public Guid OwnerId { get; } = Guid.NewGuid();
        public Guid? ActorUserId { get; set; }
        public Guid? ActorBusinessId { get; set; }
        public string? ActorRole { get; set; } = "Owner";

        public World()
        {
            ActorUserId = OwnerId;
            ActorBusinessId = Business.Id;
            Accounts = new AccountProvisioner(Users, new Argon2PasswordHasher(), Clock);
            Memberships = new FakeMemberships(() => ActorBusinessId);
            Invitations = new FakeInvitations(() => ActorBusinessId);
            Memberships.Items.Add(BusinessMembership.CreateOwner(Business.Id, OwnerId, _now));
        }

        private IActorContext Actor => new FakeActor(ActorUserId, ActorBusinessId, ActorRole);
        private FakeBusinesses Businesses => new(Business);
        private FakeDirectory Directory => new();

        public InviteMemberCommand InviteCommand() =>
            new(Businesses, Memberships, Invitations, Accounts, Linker, Directory, Mailer, Tokens, Actor, Unit, Clock);

        public Task<InvitationResponse> Invite(string email, string role, Guid? professionalId = null) =>
            InviteCommand().ExecuteAsync(new InviteMemberRequest("Convidado", email, role, professionalId));

        public ResendInvitationCommand Resend() => new(Businesses, Memberships, Invitations, Directory, Mailer, Tokens, Actor, Unit, Clock);

        public RevokeInvitationCommand Revoke() => new(Invitations, Actor, Unit, Clock);

        public GetSeatsQuery Seats() => new(Businesses, Memberships, Invitations, Actor, Clock);

        public PreviewInvitationQuery Preview() => new(Invitations, Businesses, Accounts, Directory, Tokens, Clock);

        private InvitationAcceptance Acceptance() => new(Memberships, Businesses, Linker, new FakePeople(), Unit, Clock);

        public AcceptInvitationCommand Accept() => new(Invitations, Accounts, Tokens, Actor, Acceptance(), Clock);

        public AcceptInvitationWithNewAccountCommand AcceptNew() => new(Invitations, Accounts, Tokens, Acceptance(), Clock);
    }

    private sealed class FakeActor(Guid? userId, Guid? businessId, string? role) : IActorContext
    {
        public Guid? UserId => userId;

        public Guid? BusinessId => businessId;

        public string? BusinessRole => role;

        public bool IsPlatformAdmin => false;
    }

    private sealed class CountingUnit : Booking.Application.Common.Persistence.IUnitOfWork
    {
        public int Saves { get; private set; }

        public Task<int> SaveChangesAsync(CancellationToken ct = default)
        {
            Saves++;
            return Task.FromResult(1);
        }
    }

    private sealed class FakeBusinesses(Business business) : IBusinessRepository
    {
        public Task<Business?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
            Task.FromResult(id == business.Id ? business : null);

        public Task<bool> ExistsByDocumentAsync(Document document, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<IReadOnlyList<Business>> FindBookableNearbyAsync(GeoPoint center, double radiusMeters, int limit, CancellationToken ct = default) =>
            throw new NotSupportedException();

        public Task<PagedResult<Business>> ListByStatusAsync(BusinessStatus status, BusinessCategory? category, PageRequest page, CancellationToken ct = default) =>
            throw new NotSupportedException();

        public void Add(Business added) => throw new NotSupportedException();
    }

    /// <summary>Imita o filtro global de tenant: só enxerga o que é do estabelecimento do "token".</summary>
    private sealed class FakeMemberships(Func<Guid?> currentBusiness) : IBusinessMembershipRepository
    {
        public List<BusinessMembership> Items { get; } = [];

        public Task<BusinessMembership?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
            Task.FromResult(Items.FirstOrDefault(x => x.Id == id && x.BusinessId == currentBusiness()));

        // Como no repositório real: o estabelecimento vem explícito, sem depender do token.
        public Task<BusinessMembership?> GetByBusinessAndUserAsync(Guid businessId, Guid userId, CancellationToken ct = default) =>
            Task.FromResult(Items.FirstOrDefault(x => x.BusinessId == businessId && x.UserId == userId));

        public Task<int> CountOwnedByUserAsync(Guid userId, CancellationToken ct = default) =>
            Task.FromResult(Items.Count(x => x.UserId == userId && x.Role == BusinessMembershipRole.Owner));

        public Task<int> CountSeatsAsync(CancellationToken ct = default) =>
            Task.FromResult(Items.Count(x => x.BusinessId == currentBusiness()
                && x.Status is BusinessMembershipStatus.Active or BusinessMembershipStatus.Invited));

        public void Add(BusinessMembership membership) => Items.Add(membership);
    }

    private sealed class FakeInvitations(Func<Guid?> currentBusiness) : IBusinessInvitationRepository
    {
        public List<BusinessInvitation> Items { get; } = [];

        private IEnumerable<BusinessInvitation> OfTenant => Items.Where(x => x.BusinessId == currentBusiness());

        public Task<BusinessInvitation?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
            Task.FromResult(OfTenant.FirstOrDefault(x => x.Id == id));

        public Task<BusinessInvitation?> GetByTokenHashAsync(string tokenHash, CancellationToken ct = default) =>
            Task.FromResult(Items.FirstOrDefault(x => x.TokenHash == tokenHash));

        public Task<PagedResult<BusinessInvitation>> ListPendingAsync(DateTimeOffset now, PageRequest page, CancellationToken ct = default) =>
            throw new NotSupportedException();

        public Task<int> CountPendingAsync(DateTimeOffset now, CancellationToken ct = default) =>
            Task.FromResult(OfTenant.Count(x => x.IsPending(now)));

        public Task<bool> ExistsPendingForEmailAsync(string email, DateTimeOffset now, CancellationToken ct = default) =>
            Task.FromResult(OfTenant.Any(x => x.Email == email && x.IsPending(now)));

        public void Add(BusinessInvitation invitation) => Items.Add(invitation);
    }

    private sealed class FakeLinker : IProfessionalLinker
    {
        private readonly Dictionary<Guid, bool> _profiles = [];

        public List<(Guid BusinessId, Guid MembershipId)> Created { get; } = [];
        public List<(Guid ProfessionalId, Guid MembershipId)> Linked { get; } = [];

        public Guid AddProfile(bool linked)
        {
            var id = Guid.NewGuid();
            _profiles[id] = linked;
            return id;
        }

        public Task<bool> IsLinkableAsync(Guid businessId, Guid professionalId, CancellationToken ct = default) =>
            Task.FromResult(_profiles.TryGetValue(professionalId, out bool linked) && !linked);

        public Task LinkAsync(Guid businessId, Guid professionalId, Guid membershipId, CancellationToken ct = default)
        {
            Linked.Add((professionalId, membershipId));
            return Task.CompletedTask;
        }

        public void Create(Guid businessId, string displayName, Guid membershipId) => Created.Add((businessId, membershipId));
    }

    private sealed class FakePeople : IPeopleDirectory
    {
        public Task<ProfessionalInfo?> GetProfessionalAsync(Guid businessId, Guid professionalId, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<int> CountActiveProfessionalsAsync(Guid businessId, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<Guid?> FindProfessionalIdByMembershipAsync(Guid businessId, Guid membershipId, CancellationToken ct = default) => Task.FromResult<Guid?>(null);

        public Task<Guid?> FindCustomerIdAsync(Guid userId, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<IReadOnlyList<CustomerIdentity>> GetCustomersAsync(IReadOnlyCollection<Guid> customerIds, CancellationToken ct = default) =>
            throw new NotSupportedException();
    }

    private sealed class FakeDirectory : IUserDirectory
    {
        public Task<IReadOnlyDictionary<Guid, string>> GetFullNamesAsync(IReadOnlyCollection<Guid> userIds, CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyDictionary<Guid, string>>(userIds.ToDictionary(x => x, _ => "Dona Silva"));

        public Task<IReadOnlyList<UserContact>> GetActiveContactsAsync(IReadOnlyCollection<Guid> userIds, CancellationToken ct = default) =>
            throw new NotSupportedException();
    }

    private sealed class RecordingInvitationMailer : IInvitationMailer
    {
        public List<(string Email, string Role, string RawToken)> Sent { get; } = [];

        public Task QueueInvitationAsync(
            string email, string inviteeName, string businessName, string inviterName, string roleName, string rawToken, int validDays, CancellationToken ct = default)
        {
            Sent.Add((email, roleName, rawToken));
            return Task.CompletedTask;
        }
    }
}
