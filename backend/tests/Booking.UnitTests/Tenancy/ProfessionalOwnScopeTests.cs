using Booking.Application.Common.Media;
using Booking.Application.Common.Persistence;
using Booking.Application.Common.Tenancy;
using Booking.Application.Contracts.People;
using Booking.Application.Contracts.Tenancy;
using Booking.Application.Module.Availability.Commands;
using Booking.Application.Module.People.Commands;
using Booking.Arguments.Module.People;
using Booking.Domain.Entity.Base;
using Booking.Domain.Entity.Module.People;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.People;

namespace Booking.UnitTests.Tenancy;

/// <summary>
/// O profissional com conta mexe só no que é dele (Fase 4, bloco 2): bloqueios e folgas da própria agenda, e a própria
/// especialidade e bio. Dono e atendente não têm essa restrição. Sem banco.
/// </summary>
public sealed class ProfessionalOwnScopeTests
{
    private static readonly Guid _businessId = Guid.NewGuid();
    private static readonly Guid _userId = Guid.NewGuid();
    private static readonly Guid _membershipId = Guid.NewGuid();
    private static readonly Guid _ownProfile = Guid.NewGuid();
    private static readonly Guid _otherProfile = Guid.NewGuid();

    private static AgendaScope Scope(string role, bool linked = true) =>
        new(new Actor(role), new Directory(), new People(linked ? _ownProfile : null));

    // --- Bloqueios e folgas ---

    [Theory]
    [InlineData("Owner")]
    [InlineData("Attendant")]
    public async Task Owner_and_attendant_act_on_any_professional_and_on_the_whole_business(string role)
    {
        AgendaScope scope = Scope(role);

        Assert.Equal(_businessId, await scope.EnsureCanActOnAsync(_otherProfile, default));
        Assert.Equal(_businessId, await scope.EnsureCanActOnAsync(null, default));
        Assert.Null(await scope.OwnProfessionalAsync(default));
    }

    [Fact]
    public async Task A_professional_acts_only_on_the_own_agenda()
    {
        AgendaScope scope = Scope("Professional");

        Assert.Equal(_businessId, await scope.EnsureCanActOnAsync(_ownProfile, default));
        Assert.Equal(_ownProfile, await scope.OwnProfessionalAsync(default));
    }

    [Fact]
    public async Task A_professional_cannot_block_another_professional_or_the_whole_business()
    {
        AgendaScope scope = Scope("Professional");

        Assert.Equal("auth.forbidden", (await Assert.ThrowsAsync<DomainException>(() => scope.EnsureCanActOnAsync(_otherProfile, default))).Code);
        Assert.Equal("auth.forbidden", (await Assert.ThrowsAsync<DomainException>(() => scope.EnsureCanActOnAsync(null, default))).Code);
    }

    [Fact]
    public async Task A_member_without_a_professional_profile_cannot_act_on_a_schedule()
    {
        AgendaScope scope = Scope("Professional", linked: false);

        Assert.Equal("auth.forbidden", (await Assert.ThrowsAsync<DomainException>(() => scope.EnsureCanActOnAsync(_ownProfile, default))).Code);
    }

    // --- Meu perfil ---

    [Fact]
    public async Task A_professional_edits_the_own_specialty_and_bio_but_not_the_name()
    {
        var own = Professional.Create(_businessId, "Marcos Lima", "Barbeiro", "Antiga", _membershipId);
        var unit = new CountingUnit();
        var command = new UpdateMyProfessionalProfileCommand(new Repo(own), new Directory(), new Actor("Professional"), unit, new NoImages());

        ProfessionalResponse response = await command.ExecuteAsync(new UpdateMyProfessionalProfileRequest("Barbeiro e colorista", "Cortes há 10 anos."));

        Assert.Equal("Marcos Lima", response.DisplayName);
        Assert.Equal("Barbeiro e colorista", response.Specialty);
        Assert.Equal("Cortes há 10 anos.", response.Bio);
        Assert.Equal(1, unit.Saves);
    }

    [Fact]
    public async Task A_member_without_a_linked_profile_cannot_read_or_edit_a_profile()
    {
        var actor = new Actor("Attendant");

        await Assert.ThrowsAsync<DomainException>(() => new GetMyProfessionalProfileQuery(new Repo(null), new Directory(), actor, new NoImages()).ExecuteAsync());
        DomainException refused = await Assert.ThrowsAsync<DomainException>(() =>
            new UpdateMyProfessionalProfileCommand(new Repo(null), new Directory(), actor, new CountingUnit(), new NoImages())
                .ExecuteAsync(new UpdateMyProfessionalProfileRequest("x", "y")));

        Assert.Equal("auth.forbidden", refused.Code);
    }

    private sealed class Actor(string role) : IActorContext
    {
        public Guid? UserId => _userId;

        public Guid? BusinessId => _businessId;

        public string? BusinessRole => role;

        public bool IsPlatformAdmin => false;
    }

    private sealed class Directory : IBusinessDirectory
    {
        public Task<BusinessMembershipInfo?> FindActiveMembershipAsync(Guid businessId, Guid userId, CancellationToken ct = default) =>
            Task.FromResult<BusinessMembershipInfo?>(new BusinessMembershipInfo(_membershipId, businessId, userId, "Professional"));

        public Task<BusinessContactInfo?> GetContactInfoAsync(Guid businessId, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<IReadOnlyList<Guid>> ListActiveOwnerUserIdsAsync(Guid businessId, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<Guid?> FindActiveMembershipUserIdAsync(Guid businessId, Guid membershipId, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<IReadOnlyList<UserBusinessInfo>> ListActiveBusinessesOfUserAsync(Guid userId, int limit, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<BusinessSchedulingInfo?> GetSchedulingInfoAsync(Guid businessId, CancellationToken ct = default) => throw new NotSupportedException();
    }

    private sealed class People(Guid? professionalId) : IPeopleDirectory
    {
        public Task<Guid?> FindProfessionalIdByMembershipAsync(Guid businessId, Guid membershipId, CancellationToken ct = default) =>
            Task.FromResult(membershipId == _membershipId ? professionalId : null);

        public Task<ProfessionalInfo?> GetProfessionalAsync(Guid businessId, Guid professionalId, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<int> CountActiveProfessionalsAsync(Guid businessId, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<Guid?> FindActiveProfessionalBusinessAsync(Guid professionalId, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<Guid?> FindCustomerIdAsync(Guid userId, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<IReadOnlyList<CustomerIdentity>> GetCustomersAsync(IReadOnlyCollection<Guid> customerIds, CancellationToken ct = default) =>
            throw new NotSupportedException();
    }

    private sealed class Repo(Professional? own) : IProfessionalRepository
    {
        public Task<Professional?> GetByMembershipIdAsync(Guid membershipId, CancellationToken ct = default) => Task.FromResult(own);

        public Task<Professional?> GetByIdAcrossTenantsAsync(Guid id, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<Professional?> GetByIdAsync(Guid id, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<Professional?> GetByIdOfBusinessAsync(Guid businessId, Guid id, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<PagedResult<Professional>> ListAsync(PageRequest page, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<PagedResult<Professional>> ListActiveOfBusinessAsync(Guid businessId, PageRequest page, CancellationToken ct = default) =>
            throw new NotSupportedException();

        public void Add(Professional professional) => throw new NotSupportedException();
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
        public Booking.Arguments.Common.ImageSetResponse? For(string? key) => null;
    }
}
