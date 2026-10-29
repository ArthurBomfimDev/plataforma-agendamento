using Booking.Domain.Entity.Module.Catalog;
using Booking.Domain.Entity.Module.Compliance;
using Booking.Domain.Entity.Module.People;
using Booking.Domain.Entity.Module.Tenancy;
using Booking.Domain.Enum.Module.Compliance;
using Booking.Domain.Enum.Module.Tenancy;
using Booking.Domain.Exceptions;
using Booking.Domain.ValueObject;

namespace Booking.UnitTests.Tenancy;

public sealed class TenancyAndCatalogDomainTests
{
    private static readonly DateTimeOffset _now = new(2026, 10, 19, 12, 0, 0, TimeSpan.Zero);

    [Theory]
    [InlineData("529.982.247-25", DocumentKind.Cpf)]
    [InlineData("11.222.333/0001-81", DocumentKind.Cnpj)]
    public void Valid_document_is_normalized_to_digits(string raw, DocumentKind kind)
    {
        Document document = Document.Of(raw);

        Assert.Equal(kind, document.Kind);
        Assert.All(document.Number, c => Assert.True(char.IsDigit(c)));
    }

    [Theory]
    [InlineData("529.982.247-24")]
    [InlineData("111.111.111-11")]
    [InlineData("11.222.333/0001-80")]
    [InlineData("123")]
    public void Invalid_document_is_rejected(string raw)
    {
        Assert.Throws<DomainException>(() => Document.Of(raw));
    }

    [Fact]
    public void Business_lifecycle_follows_draft_review_active()
    {
        Business business = NewBusiness();

        Assert.Throws<DomainException>(business.Approve);

        business.Submit();
        business.Approve();

        Assert.Equal(BusinessStatus.Active, business.Status);
        Assert.True(business.IsBookable);
    }

    [Fact]
    public void Changing_the_address_drops_the_confirmed_location()
    {
        Business business = NewBusiness();
        GeoPoint point = GeoPoint.Of(-22.21, -49.65);

        Assert.Throws<DomainException>(() => business.ConfirmLocation(point, LocationPrecision.Rooftop, _now));

        business.Geocode(point, LocationPrecision.Street, "test", _now);
        business.ConfirmLocation(point, LocationPrecision.Street, _now);
        Assert.NotNull(business.LocationConfirmedAt);

        business.UpdateAddress("Rua A", "10", "Centro", "Garça", "sp", "17400-000");

        Assert.Null(business.LocationConfirmedAt);
        Assert.Equal("SP", business.State);
        Assert.Equal("17400000", business.PostalCode);
    }

    [Theory]
    [InlineData(0, 2, 60, 24)]
    [InlineData(12, -1, 60, 24)]
    [InlineData(12, 2, 0, 24)]
    [InlineData(12, 2, 60, 49)]
    public void Scheduling_policy_rejects_values_out_of_range(int pending, int lead, int horizon, int cancellation)
    {
        Assert.Throws<DomainException>(() => NewBusiness().UpdateSchedulingPolicy(false, pending, lead, horizon, cancellation));
    }

    [Fact]
    public void Service_rejects_step_larger_than_duration_and_negative_price()
    {
        Guid business = Guid.CreateVersion7();

        Assert.Throws<DomainException>(() => Service.Create(business, "Corte", null, 30, 0, 0, 45, 5000, null));
        Assert.Throws<DomainException>(() => Service.Create(business, "Corte", null, 30, 0, 0, 15, -1, null));
        Assert.Throws<DomainException>(() => Service.Create(business, "Corte", null, 0, 0, 0, 15, 5000, null));
    }

    [Fact]
    public void Professional_override_wins_over_the_service_default()
    {
        Service service = Service.Create(Guid.CreateVersion7(), "Corte", null, 30, 0, 0, 15, 5000, null);
        ServiceProfessional withOverride = ServiceProfessional.Enable(service.BusinessId, service.Id, Guid.CreateVersion7(), 7000, null);

        Assert.Equal(7000, withOverride.EffectivePriceCents(service));
        Assert.Equal(30, withOverride.EffectiveDurationMinutes(service));
    }

    [Fact]
    public void Customer_must_be_at_least_eighteen()
    {
        DateOnly today = new(2026, 10, 19);

        Assert.Throws<DomainException>(() => Customer.Create(Guid.CreateVersion7(), new DateOnly(2008, 10, 20), null, today));
        Assert.Equal(18, Customer.AgeOn(new DateOnly(2008, 10, 19), today));
        Customer.Create(Guid.CreateVersion7(), new DateOnly(2008, 10, 19), null, today);
    }

    [Fact]
    public void Full_public_profile_requires_the_professionals_own_consent()
    {
        Professional professional = Professional.Create(Guid.CreateVersion7(), "Ricardo", "Barbeiro", "Bio", null);

        Assert.Throws<DomainException>(professional.ShowFullProfile);

        professional.GrantPublicProfileConsent(_now);
        professional.ShowFullProfile();
        Assert.True(professional.IsPubliclyVisible);

        professional.RevokePublicProfileConsent();
        Assert.False(professional.IsPubliclyVisible);
    }

    [Fact]
    public void Consent_is_tied_to_the_version_and_revocation_is_kept()
    {
        ConsentRecord consent = ConsentRecord.Grant(Guid.CreateVersion7(), ConsentPurpose.SensitiveScheduling, "2026-10-v1", _now);

        Assert.True(consent.IsActiveFor("2026-10-v1"));
        Assert.False(consent.IsActiveFor("2026-11-v2"));

        consent.Revoke(_now);

        Assert.False(consent.IsActiveFor("2026-10-v1"));
        Assert.Throws<DomainException>(() => consent.Revoke(_now));
    }

    private static Business NewBusiness() => Business.Create("Barbearia", Document.Of("11.222.333/0001-81"), BusinessCategory.Beleza);
}
