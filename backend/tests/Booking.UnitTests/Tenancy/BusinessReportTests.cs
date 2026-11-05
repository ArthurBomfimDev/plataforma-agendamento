using Booking.Application.Common.Persistence;
using Booking.Application.Common.Tenancy;
using Booking.Application.Module.Tenancy.Commands;
using Booking.Arguments.Module.Tenancy;
using Booking.Domain.Entity.Base;
using Booking.Domain.Entity.Module.Tenancy;
using Booking.Domain.Enum.Module.Tenancy;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.Tenancy;
using Booking.Domain.ValueObject;

namespace Booking.UnitTests.Tenancy;

/// <summary>Denúncia na página pública (Fase 3): a regra do domínio e o comando, sem banco.</summary>
public sealed class BusinessReportTests
{
    private static readonly DateTimeOffset _now = new(2026, 11, 4, 12, 0, 0, TimeSpan.Zero);

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("curt")] // 4 caracteres: abaixo do mínimo de 5
    public void Reason_shorter_than_5_characters_is_refused(string reason) =>
        Assert.Equal("report.reason_invalid", Assert.Throws<DomainException>(() => BusinessReport.Create(Guid.NewGuid(), reason, null, _now)).Message);

    [Fact]
    public void Reason_with_exactly_5_characters_is_accepted() =>
        Assert.Equal("curto", BusinessReport.Create(Guid.NewGuid(), "curto", null, _now).Reason);

    [Fact]
    public void Reason_too_long_is_refused_and_the_reason_is_trimmed()
    {
        Assert.Throws<DomainException>(() => BusinessReport.Create(Guid.NewGuid(), new string('x', 501), null, _now));

        BusinessReport report = BusinessReport.Create(Guid.NewGuid(), "  Foto de outra pessoa.  ", null, _now);

        Assert.Equal("Foto de outra pessoa.", report.Reason);
        Assert.Equal(BusinessReportStatus.Open, report.Status);
        Assert.Null(report.ReporterUserId); // anônima: ninguém é identificado
    }

    [Fact]
    public void Resolving_records_who_decided_and_when_and_can_only_happen_once()
    {
        BusinessReport report = BusinessReport.Create(Guid.NewGuid(), "Perfil falso.", Guid.NewGuid(), _now);
        var admin = Guid.NewGuid();

        report.Resolve(admin, "  Sem procedência.  ", _now.AddHours(1));

        Assert.Equal(BusinessReportStatus.Resolved, report.Status);
        Assert.Equal(admin, report.ResolvedByUserId);
        Assert.Equal(_now.AddHours(1), report.ResolvedAt);
        Assert.Equal("Sem procedência.", report.Resolution);
        Assert.Equal("report.cannot_resolve_from_current_status", Assert.Throws<DomainException>(() => report.Resolve(admin, null, _now)).Message);
    }

    [Fact]
    public async Task Only_an_active_business_can_be_reported_and_the_report_is_saved_with_the_reporter_account()
    {
        var active = Business.Create("Studio Silva", Document.Of("11.222.333/0001-81"), BusinessCategory.Beleza);
        active.Publish();
        var draft = Business.Create("Rascunho", Document.Of("11.222.333/0001-81"), BusinessCategory.Beleza);
        var reporter = Guid.NewGuid();
        var reports = new FakeReports();
        var unit = new FakeUnit();
        var command = new ReportBusinessCommand(new FakeBusinesses(active, draft), reports, new FakeActor(reporter), unit, new FixedClock(_now));

        await command.ExecuteAsync(active.Id, new ReportBusinessRequest("Conteúdo enganoso."));

        BusinessReport saved = Assert.Single(reports.Added);
        Assert.Equal(active.Id, saved.BusinessId);
        Assert.Equal(reporter, saved.ReporterUserId);
        Assert.Equal(1, unit.Saves);

        // Rascunho e inexistente respondem como "não encontrado": a rota não confirma que o estabelecimento existe.
        Assert.Equal("business.not_found", (await Assert.ThrowsAsync<DomainException>(() => command.ExecuteAsync(draft.Id, new ReportBusinessRequest("Conteúdo enganoso.")))).Message);
        Assert.Equal("business.not_found", (await Assert.ThrowsAsync<DomainException>(() => command.ExecuteAsync(Guid.NewGuid(), new ReportBusinessRequest("Conteúdo enganoso.")))).Message);
        Assert.Single(reports.Added);
    }

    [Fact]
    public async Task An_anonymous_report_is_accepted_without_identifying_anyone()
    {
        var active = Business.Create("Studio Silva", Document.Of("11.222.333/0001-81"), BusinessCategory.Beleza);
        active.Publish();
        var reports = new FakeReports();
        var command = new ReportBusinessCommand(new FakeBusinesses(active), reports, new FakeActor(null), new FakeUnit(), new FixedClock(_now));

        await command.ExecuteAsync(active.Id, new ReportBusinessRequest("Conteúdo enganoso."));

        Assert.Null(Assert.Single(reports.Added).ReporterUserId);
    }

    private sealed class FakeReports : IBusinessReportRepository
    {
        public List<BusinessReport> Added { get; } = [];

        public void Add(BusinessReport report) => Added.Add(report);

        public Task<BusinessReport?> GetByIdAsync(Guid id, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<PagedResult<BusinessReport>> ListByStatusAsync(BusinessReportStatus status, PageRequest page, CancellationToken ct = default) =>
            throw new NotSupportedException();
    }

    private sealed class FakeBusinesses(params Business[] all) : IBusinessRepository
    {
        public Task<Business?> GetByIdAsync(Guid id, CancellationToken ct = default) => Task.FromResult(all.FirstOrDefault(b => b.Id == id));

        public Task<bool> ExistsByDocumentAsync(Document document, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<IReadOnlyList<Business>> FindBookableNearbyAsync(GeoPoint center, double radiusMeters, int limit, CancellationToken ct = default) =>
            throw new NotSupportedException();

        public Task<PagedResult<Business>> ListByStatusAsync(BusinessStatus status, BusinessCategory? category, PageRequest page, CancellationToken ct = default) =>
            throw new NotSupportedException();

        public void Add(Business business) => throw new NotSupportedException();
    }

    private sealed class FakeActor(Guid? userId) : IActorContext
    {
        public Guid? UserId => userId;

        public Guid? BusinessId => null;

        public string? BusinessRole => null;

        public bool IsPlatformAdmin => false;
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

    private sealed class FixedClock(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }
}
