using Booking.Application.Common.Media;
using Booking.Application.Common.Persistence;
using Booking.Application.Common.Tenancy;
using Booking.Application.Contracts.Tenancy;
using Booking.Application.Module.People.Commands;
using Booking.Arguments.Common;
using Booking.Arguments.Module.People;
using Booking.Domain.Entity.Base;
using Booking.Domain.Entity.Module.People;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.People;

namespace Booking.UnitTests.Tenancy;

/// <summary>
/// A declaração do dono (Fase 4, bloco 3, ADR-031): salvar a bio de quem não tem conta exige o checkbox; quem tem conta
/// não depende dele. Sem banco.
/// </summary>
public sealed class ProfessionalDeclarationTests
{
    private static readonly DateTimeOffset _now = new(2026, 11, 4, 12, 0, 0, TimeSpan.Zero);
    private static readonly Guid _businessId = Guid.NewGuid();
    private static readonly Guid _ownerId = Guid.NewGuid();

    private static CreateProfessionalCommand Create(FakeRepo repo, FakeUnit unit) =>
        new(repo, new FakeDirectory(), new Owner(), unit, new FixedClock(), new NoImages());

    private static UpdateProfessionalCommand Update(FakeRepo repo, FakeUnit unit) =>
        new(repo, new Owner(), unit, new FixedClock(), new NoImages());

    [Fact]
    public async Task Saving_a_bio_without_the_declaration_is_refused_and_nothing_is_saved()
    {
        var repo = new FakeRepo();
        var unit = new FakeUnit();

        DomainException refused = await Assert.ThrowsAsync<DomainException>(() =>
            Create(repo, unit).ExecuteAsync(new CreateProfessionalRequest("Marcos", "Barbeiro", "Cortes há 10 anos.", false)));

        Assert.Equal("professional.declaration_required", refused.Code);
        Assert.Equal(0, unit.Saves);
    }

    [Fact]
    public async Task With_the_declaration_the_bio_is_saved_and_who_and_when_are_recorded()
    {
        var repo = new FakeRepo();
        var unit = new FakeUnit();

        ProfessionalResponse saved = await Create(repo, unit).ExecuteAsync(
            new CreateProfessionalRequest("Marcos", "Barbeiro", "Cortes há 10 anos.", false, AuthorizationDeclared: true, Registration: null));

        Professional stored = Assert.Single(repo.Items);
        Assert.True(saved.AuthorizationDeclared);
        Assert.Equal(_ownerId, stored.AuthorizationDeclaredByUserId);
        Assert.Equal(_now, stored.AuthorizationDeclaredAt);
        Assert.Equal(1, unit.Saves);
    }

    [Fact]
    public async Task A_professional_without_a_bio_needs_no_declaration()
    {
        var repo = new FakeRepo();

        ProfessionalResponse saved = await Create(repo, new FakeUnit()).ExecuteAsync(new CreateProfessionalRequest("Marcos", "Barbeiro", null, false));

        Assert.False(saved.AuthorizationDeclared);
    }

    [Fact]
    public async Task Updating_keeps_an_earlier_declaration_and_a_new_bio_does_not_ask_again()
    {
        var existing = Professional.Create(_businessId, "Marcos", null, null, null);
        existing.DeclareAuthorization(_ownerId, _now.AddDays(-1));
        var repo = new FakeRepo(existing);

        ProfessionalResponse saved = await Update(repo, new FakeUnit()).ExecuteAsync(
            existing.Id, new UpdateProfessionalRequest("Marcos", "Barbeiro", "Nova bio.", IsActive: true));

        Assert.Equal("Nova bio.", saved.Bio);
        Assert.Equal(_now.AddDays(-1), existing.AuthorizationDeclaredAt);
    }

    [Fact]
    public async Task Updating_a_bio_of_someone_never_declared_is_refused()
    {
        var existing = Professional.Create(_businessId, "Marcos", null, null, null);
        var repo = new FakeRepo(existing);

        DomainException refused = await Assert.ThrowsAsync<DomainException>(() =>
            Update(repo, new FakeUnit()).ExecuteAsync(existing.Id, new UpdateProfessionalRequest("Marcos", "Barbeiro", "Bio.", IsActive: true)));

        Assert.Equal("professional.declaration_required", refused.Code);
    }

    [Fact]
    public async Task Whoever_has_an_account_controls_the_own_bio_without_the_owner_declaration()
    {
        var withAccount = Professional.Create(_businessId, "Marcos", null, null, Guid.NewGuid());
        var repo = new FakeRepo(withAccount);

        ProfessionalResponse saved = await Update(repo, new FakeUnit()).ExecuteAsync(
            withAccount.Id, new UpdateProfessionalRequest("Marcos", "Barbeiro", "Bio.", IsActive: true));

        Assert.Equal("Bio.", saved.Bio);
        Assert.False(saved.AuthorizationDeclared);
    }

    [Fact]
    public async Task Deactivating_an_old_record_with_a_bio_and_no_declaration_is_never_blocked()
    {
        var legacy = Professional.Create(_businessId, "Marcos", "Barbeiro", "Bio antiga.", null);
        var repo = new FakeRepo(legacy);

        ProfessionalResponse saved = await Update(repo, new FakeUnit()).ExecuteAsync(
            legacy.Id, new UpdateProfessionalRequest("Marcos", "Barbeiro", "Bio antiga.", IsActive: false));

        Assert.False(saved.IsActive);
        Assert.False(saved.AuthorizationDeclared);
    }

    [Fact]
    public async Task Deactivating_takes_the_professional_off_the_public_profile_without_asking_for_anything()
    {
        var existing = Professional.Create(_businessId, "Marcos", null, null, null);
        var repo = new FakeRepo(existing);

        ProfessionalResponse saved = await Update(repo, new FakeUnit()).ExecuteAsync(
            existing.Id, new UpdateProfessionalRequest("Marcos", null, null, IsActive: false));

        Assert.False(saved.IsActive);
    }

    private sealed class Owner : IActorContext
    {
        public Guid? UserId => _ownerId;

        public Guid? BusinessId => _businessId;

        public string? BusinessRole => "Owner";

        public bool IsPlatformAdmin => false;
    }

    private sealed class FixedClock : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => _now;
    }

    private sealed class FakeUnit : IUnitOfWork
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

    private sealed class FakeRepo(params Professional[] existing) : IProfessionalRepository
    {
        public List<Professional> Items { get; } = [.. existing];

        public Task<Professional?> GetByIdAsync(Guid id, CancellationToken ct = default) => Task.FromResult(Items.FirstOrDefault(x => x.Id == id));

        public void Add(Professional professional) => Items.Add(professional);

        public Task<Professional?> GetByMembershipIdAsync(Guid membershipId, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<Professional?> GetByIdOfBusinessAsync(Guid businessId, Guid id, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<PagedResult<Professional>> ListAsync(PageRequest page, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<PagedResult<Professional>> ListActiveOfBusinessAsync(Guid businessId, PageRequest page, CancellationToken ct = default) =>
            throw new NotSupportedException();
    }

    private sealed class FakeDirectory : IBusinessDirectory
    {
        public Task<BusinessMembershipInfo?> FindActiveMembershipAsync(Guid businessId, Guid userId, CancellationToken ct = default) =>
            Task.FromResult<BusinessMembershipInfo?>(new BusinessMembershipInfo(Guid.NewGuid(), businessId, userId, "Owner"));

        public Task<BusinessContactInfo?> GetContactInfoAsync(Guid businessId, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<IReadOnlyList<Guid>> ListActiveOwnerUserIdsAsync(Guid businessId, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<Guid?> FindActiveMembershipUserIdAsync(Guid businessId, Guid membershipId, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<IReadOnlyList<UserBusinessInfo>> ListActiveBusinessesOfUserAsync(Guid userId, int limit, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<BusinessSchedulingInfo?> GetSchedulingInfoAsync(Guid businessId, CancellationToken ct = default) => throw new NotSupportedException();
    }
}
