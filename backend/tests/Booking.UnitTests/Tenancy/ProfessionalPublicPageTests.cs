using Booking.Application.Common.Media;
using Booking.Application.Common.Persistence;
using Booking.Application.Common.Tenancy;
using Booking.Application.Contracts.Catalog;
using Booking.Application.Contracts.Notifications;
using Booking.Application.Contracts.People;
using Booking.Application.Contracts.Tenancy;
using Booking.Application.Module.People.Commands;
using Booking.Application.Module.People.Queries;
using Booking.Application.Module.Tenancy.Commands;
using Booking.Arguments.Common;
using Booking.Arguments.Module.People;
using Booking.Domain.Entity.Base;
using Booking.Domain.Entity.Module.People;
using Booking.Domain.Entity.Module.Tenancy;
using Booking.Domain.Enum.Module.People;
using Booking.Domain.Enum.Module.Tenancy;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.People;
using Booking.Domain.Interface.Repository.Module.Tenancy;

namespace Booking.UnitTests.Tenancy;

/// <summary>
/// Página pública do profissional, pedido de remoção de perfil e "Sair do estabelecimento" (ADR-031). Sem banco.
/// </summary>
public sealed class ProfessionalPublicPageTests
{
    private static readonly DateTimeOffset _now = new(2026, 11, 4, 12, 0, 0, TimeSpan.Zero);
    private static readonly Guid _businessId = Guid.NewGuid();

    // --- Página pública ---

    [Fact]
    public async Task The_page_shows_the_profile_the_services_with_the_professional_price_and_the_business()
    {
        Professional professional = Professional.Create(_businessId, "Marcos Lima", "Barbeiro", "Cortes há 10 anos.", null);
        professional.SetRegistration("CRP 06/123456");
        World world = new(professional);

        ProfessionalPageResponse page = await world.Page().ExecuteAsync(professional.Id);

        Assert.Equal("Marcos Lima", page.DisplayName);
        Assert.Equal("Cortes há 10 anos.", page.Bio);
        Assert.Equal("CRP 06/123456", page.Registration);
        Assert.Equal("Estúdio Silva", page.Business.Name);
        Assert.Equal("Rua A, 10", page.Business.AddressLine);
        ProfessionalServiceResponse service = Assert.Single(page.Services);
        Assert.Equal(5500, service.PriceCents); // o preço do profissional, com override
        Assert.Equal(40, service.DurationMinutes);
    }

    [Fact]
    public async Task The_registration_only_comes_when_informed()
    {
        var professional = Professional.Create(_businessId, "Ana", null, null, null);

        Assert.Null((await new World(professional).Page().ExecuteAsync(professional.Id)).Registration);
    }

    [Fact]
    public async Task An_unknown_inactive_or_inactive_business_professional_answers_not_found_alike()
    {
        var inactive = Professional.Create(_businessId, "Ana", null, null, null);
        inactive.Deactivate();
        var active = Professional.Create(_businessId, "Bia", null, null, null);

        Assert.Equal("professional.not_found", (await Assert.ThrowsAsync<DomainException>(() => new World(inactive).Page().ExecuteAsync(inactive.Id))).Code);
        Assert.Equal("professional.not_found", (await Assert.ThrowsAsync<DomainException>(() => new World(active).Page().ExecuteAsync(Guid.NewGuid()))).Code);
        Assert.Equal("professional.not_found", (await Assert.ThrowsAsync<DomainException>(() => new World(active, bookable: false).Page().ExecuteAsync(active.Id))).Code);
    }

    // --- Pedido de remoção ---

    [Fact]
    public async Task A_removal_request_is_stored_and_the_owner_is_notified_without_login_or_ip()
    {
        var professional = Professional.Create(_businessId, "Marcos Lima", null, null, null);
        World world = new(professional);

        await world.Removal().ExecuteAsync(professional.Id, new RequestProfessionalRemovalRequest("  Não autorizei a foto.  ", " ana@example.com "));

        ProfessionalRemovalRequest saved = Assert.Single(world.Requests.Items);
        Assert.Equal("Não autorizei a foto.", saved.Reason);
        Assert.Equal("ana@example.com", saved.Contact);
        Assert.Equal(RemovalRequestStatus.Open, saved.Status);
        ProfessionalRemovalFacts facts = Assert.Single(world.Notifier.Sent);
        Assert.Equal(_businessId, facts.BusinessId);
        Assert.Equal("Marcos Lima", facts.ProfessionalName);
        Assert.Equal(1, world.Unit.Saves);
    }

    [Theory]
    [InlineData("")]
    [InlineData("curt")]
    public async Task A_removal_reason_shorter_than_5_characters_is_refused_before_anything_is_sent(string reason)
    {
        var professional = Professional.Create(_businessId, "Marcos", null, null, null);
        World world = new(professional);

        Assert.Equal("removal_request.reason_invalid", (await Assert.ThrowsAsync<DomainException>(() =>
            world.Removal().ExecuteAsync(professional.Id, new RequestProfessionalRemovalRequest(reason, null)))).Code);
        Assert.Empty(world.Notifier.Sent);
        Assert.Equal(0, world.Unit.Saves);
    }

    [Fact]
    public async Task One_cannot_ask_to_remove_a_profile_the_public_does_not_see()
    {
        var inactive = Professional.Create(_businessId, "Ana", null, null, null);
        inactive.Deactivate();
        World world = new(inactive);

        await Assert.ThrowsAsync<DomainException>(() =>
            world.Removal().ExecuteAsync(inactive.Id, new RequestProfessionalRemovalRequest("Motivo válido.", null)));
        Assert.Empty(world.Requests.Items);
    }

    [Fact]
    public async Task Only_the_platform_admin_lists_and_resolves_and_resolving_twice_is_refused()
    {
        var professional = Professional.Create(_businessId, "Marcos", null, null, null);
        World world = new(professional);
        await world.Removal().ExecuteAsync(professional.Id, new RequestProfessionalRemovalRequest("Motivo válido.", null));
        Guid id = world.Requests.Items[0].Id;

        Assert.Equal("auth.forbidden", (await Assert.ThrowsAsync<DomainException>(() =>
            world.List(admin: false).ExecuteAsync(null, new PageRequest(1, 20)))).Code);
        Assert.Equal("auth.forbidden", (await Assert.ThrowsAsync<DomainException>(() =>
            world.Resolve(admin: false).ExecuteAsync(id, "ok"))).Code);

        PagedResult<ProfessionalRemovalResponse> open = await world.List(admin: true).ExecuteAsync(null, new PageRequest(1, 20));
        Assert.Equal("Marcos", Assert.Single(open.Items).ProfessionalName);

        ProfessionalRemovalResponse resolved = await world.Resolve(admin: true).ExecuteAsync(id, " Conversei com o dono. ");
        Assert.Equal("Resolved", resolved.Status);
        Assert.Equal("Conversei com o dono.", resolved.Resolution);
        Assert.Equal("removal_request.cannot_resolve_from_current_status",
            (await Assert.ThrowsAsync<DomainException>(() => world.Resolve(admin: true).ExecuteAsync(id, null))).Code);
    }

    // --- Sair do estabelecimento ---

    [Theory]
    [InlineData(BusinessMembershipRole.Professional)]
    [InlineData(BusinessMembershipRole.Attendant)]
    public async Task A_member_leaves_the_business_and_the_profile_is_deactivated(BusinessMembershipRole role)
    {
        var membership = BusinessMembership.CreateAccepted(_businessId, Guid.NewGuid(), role, _now.AddDays(-5));
        World world = new(Professional.Create(_businessId, "Ana", null, null, membership.Id), membership);

        await world.Leave(membership.UserId).ExecuteAsync();

        Assert.Equal(BusinessMembershipStatus.Removed, membership.Status);
        Assert.Equal(_now, membership.RemovedAt);
        Assert.Equal(membership.Id, Assert.Single(world.Linker.Deactivated));
        Assert.Equal(1, world.Unit.Saves);
    }

    [Fact]
    public async Task The_owner_cannot_leave_and_someone_without_a_membership_is_refused()
    {
        var owner = BusinessMembership.CreateOwner(_businessId, Guid.NewGuid(), _now);
        World world = new(Professional.Create(_businessId, "Ana", null, null, null), owner);

        Assert.Equal("business_membership.cannot_remove_owner",
            (await Assert.ThrowsAsync<DomainException>(() => world.Leave(owner.UserId).ExecuteAsync())).Code);
        Assert.Empty(world.Linker.Deactivated);

        Assert.Equal("auth.forbidden", (await Assert.ThrowsAsync<DomainException>(() => world.Leave(Guid.NewGuid()).ExecuteAsync())).Code);
    }

    private sealed class World
    {
        private readonly Professional _professional;
        private readonly bool _bookable;
        private readonly BusinessMembership? _membership;

        public FakeRequests Requests { get; } = new();
        public FakeNotifier Notifier { get; } = new();
        public CountingUnit Unit { get; } = new();
        public FakeLinker Linker { get; } = new();

        public World(Professional professional, BusinessMembership? membership = null, bool bookable = true)
        {
            _professional = professional;
            _membership = membership;
            _bookable = bookable;
        }

        private FakeProfessionals Professionals => new(_professional);

        private FakeDirectory Directory => new(_bookable);

        public GetPublicProfessionalQuery Page() => new(Professionals, Directory, new FakeCatalog(), new NoImages());

        public RequestProfessionalRemovalCommand Removal() => new(Professionals, Requests, Directory, Notifier, Unit, new FixedClock());

        public ListProfessionalRemovalRequestsQuery List(bool admin) => new(Requests, Professionals, Directory, new Actor(admin));

        public ResolveProfessionalRemovalRequestCommand Resolve(bool admin) =>
            new(Requests, Professionals, Directory, new Actor(admin), Unit, new FixedClock());

        public LeaveBusinessCommand Leave(Guid userId) =>
            new(new FakeMemberships(_membership), Linker, new Actor(false, userId), Unit, new FixedClock());
    }

    private sealed class Actor(bool admin, Guid? userId = null) : IActorContext
    {
        public Guid? UserId { get; } = userId ?? Guid.NewGuid();

        public Guid? BusinessId => _businessId;

        public string? BusinessRole => "Professional";

        public bool IsPlatformAdmin => admin;
    }

    private sealed class FixedClock : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => _now;
    }

    private sealed class CountingUnit : IUnitOfWork
    {
        public int Saves { get; private set; }

        public Task<int> SaveChangesAsync(CancellationToken ct = default)
        {
            Saves++;
            return Task.FromResult(1);
        }
    }

    private sealed class NoImages : IImageUrls
    {
        public ImageSetResponse? For(string? key) => null;
    }

    private sealed class FakeProfessionals(Professional professional) : IProfessionalRepository
    {
        public Task<Professional?> GetByIdAcrossTenantsAsync(Guid id, CancellationToken ct = default) =>
            Task.FromResult<Professional?>(professional.Id == id ? professional : null);

        public Task<Professional?> GetByIdAsync(Guid id, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<Professional?> GetByMembershipIdAsync(Guid membershipId, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<Professional?> GetByIdOfBusinessAsync(Guid businessId, Guid id, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<PagedResult<Professional>> ListAsync(PageRequest page, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<PagedResult<Professional>> ListActiveOfBusinessAsync(Guid businessId, PageRequest page, CancellationToken ct = default) =>
            throw new NotSupportedException();

        public void Add(Professional added) => throw new NotSupportedException();
    }

    private sealed class FakeRequests : IProfessionalRemovalRequestRepository
    {
        public List<ProfessionalRemovalRequest> Items { get; } = [];

        public Task<ProfessionalRemovalRequest?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
            Task.FromResult(Items.FirstOrDefault(x => x.Id == id));

        public Task<PagedResult<ProfessionalRemovalRequest>> ListByStatusAsync(RemovalRequestStatus status, PageRequest page, CancellationToken ct = default)
        {
            List<ProfessionalRemovalRequest> found = [.. Items.Where(x => x.Status == status)];
            return Task.FromResult(new PagedResult<ProfessionalRemovalRequest>(found, page.Page, page.PageSize, found.Count));
        }

        public void Add(ProfessionalRemovalRequest request) => Items.Add(request);
    }

    private sealed class FakeNotifier : IProfessionalRemovalNotifier
    {
        public List<ProfessionalRemovalFacts> Sent { get; } = [];

        public Task NotifyAsync(ProfessionalRemovalFacts request, CancellationToken ct = default)
        {
            Sent.Add(request);
            return Task.CompletedTask;
        }
    }

    private sealed class FakeCatalog : IServiceCatalog
    {
        public Task<IReadOnlyList<ProfessionalServiceInfo>> ListForProfessionalAsync(Guid businessId, Guid professionalId, CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyList<ProfessionalServiceInfo>>([new ProfessionalServiceInfo(Guid.NewGuid(), "Corte", 40, 5500, null)]);

        public Task<BookableService?> GetBookableAsync(Guid businessId, Guid serviceId, Guid professionalId, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<bool> HasBookableServiceAsync(Guid businessId, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<IReadOnlyDictionary<Guid, ServiceHighlight>> GetHighlightsAsync(IReadOnlyCollection<Guid> businessIds, string? term, CancellationToken ct = default) =>
            throw new NotSupportedException();

        public Task<IReadOnlySet<Guid>> FilterBusinessesOfferingAsync(IReadOnlyCollection<Guid> businessIds, string term, CancellationToken ct = default) =>
            throw new NotSupportedException();
    }

    private sealed class FakeDirectory(bool bookable) : IBusinessDirectory
    {
        public Task<BusinessSchedulingInfo?> GetSchedulingInfoAsync(Guid businessId, CancellationToken ct = default) =>
            Task.FromResult<BusinessSchedulingInfo?>(new BusinessSchedulingInfo(businessId, "America/Sao_Paulo", bookable, false, false, 12, 2, 60, 24));

        public Task<BusinessContactInfo?> GetContactInfoAsync(Guid businessId, CancellationToken ct = default) =>
            Task.FromResult<BusinessContactInfo?>(new BusinessContactInfo(businessId, "Estúdio Silva", "Rua A, 10", null, null, "America/Sao_Paulo", false));

        public Task<BusinessMembershipInfo?> FindActiveMembershipAsync(Guid businessId, Guid userId, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<IReadOnlyList<Guid>> ListActiveOwnerUserIdsAsync(Guid businessId, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<Guid?> FindActiveMembershipUserIdAsync(Guid businessId, Guid membershipId, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<IReadOnlyList<UserBusinessInfo>> ListActiveBusinessesOfUserAsync(Guid userId, int limit, CancellationToken ct = default) => throw new NotSupportedException();
    }

    private sealed class FakeMemberships(BusinessMembership? membership) : IBusinessMembershipRepository
    {
        public Task<BusinessMembership?> GetByBusinessAndUserAsync(Guid businessId, Guid userId, CancellationToken ct = default) =>
            Task.FromResult(membership is not null && membership.UserId == userId ? membership : null);

        public Task<BusinessMembership?> GetByIdAsync(Guid id, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<int> CountOwnedByUserAsync(Guid userId, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<int> CountSeatsAsync(CancellationToken ct = default) => throw new NotSupportedException();

        public Task<PagedResult<BusinessMembership>> ListActiveAsync(PageRequest page, CancellationToken ct = default) => throw new NotSupportedException();

        public void Add(BusinessMembership added) => throw new NotSupportedException();
    }

    private sealed class FakeLinker : IProfessionalLinker
    {
        public List<Guid> Deactivated { get; } = [];

        public Task DeactivateByMembershipAsync(Guid membershipId, CancellationToken ct = default)
        {
            Deactivated.Add(membershipId);
            return Task.CompletedTask;
        }

        public Task<bool> IsLinkableAsync(Guid businessId, Guid professionalId, CancellationToken ct = default) => throw new NotSupportedException();

        public Task LinkAsync(Guid businessId, Guid professionalId, Guid membershipId, CancellationToken ct = default) => throw new NotSupportedException();

        public void Create(Guid businessId, string displayName, Guid membershipId, string? specialty) => throw new NotSupportedException();
    }
}
