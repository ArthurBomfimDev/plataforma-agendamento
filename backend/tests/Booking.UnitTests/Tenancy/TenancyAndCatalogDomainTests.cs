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

    // CNPJ alfanumérico (IN RFB 2.229/2024): o exemplo oficial da Receita é 12.ABC.345/01DE-35.
    [Theory]
    [InlineData("12.ABC.345/01DE-35", "12ABC34501DE35")]
    [InlineData("12abc34501de35", "12ABC34501DE35")]
    [InlineData(" 12ABC34501DE35 ", "12ABC34501DE35")]
    [InlineData("AB12CD34EF5602", "AB12CD34EF5602")]
    public void Valid_alphanumeric_cnpj_keeps_its_letters_in_uppercase(string raw, string expected)
    {
        Document document = Document.Of(raw);

        Assert.Equal(DocumentKind.Cnpj, document.Kind);
        Assert.Equal(expected, document.Number);
    }

    [Theory]
    [InlineData("12.ABC.345/01DE-36")] // dígito verificador errado
    [InlineData("12ABC34501DEAB")] // letra nas posições dos dígitos verificadores
    [InlineData("AAAAAAAAAAAAAA")] // caracteres repetidos
    [InlineData("12ABC34501DE3")] // 13 caracteres
    [InlineData("12ABC34501DE355")] // 15 caracteres
    [InlineData("12ABC34501D!35")] // símbolo no corpo
    [InlineData("ABC.982.247-25")] // CPF não aceita letra
    public void Invalid_alphanumeric_document_is_rejected(string raw)
    {
        Assert.Throws<DomainException>(() => Document.Of(raw));
    }

    [Fact]
    public void Numeric_cnpj_still_validates_through_the_same_routine()
    {
        Assert.Equal("11222333000181", Document.Of("11.222.333/0001-81").Number);
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
    public void Beauty_business_publishes_straight_to_active_without_review()
    {
        Business business = NewBusiness();

        business.Publish();

        Assert.Equal(BusinessStatus.Active, business.Status);
        Assert.True(business.IsBookable);
        Assert.Throws<DomainException>(business.Publish); // já ativo: não publica de novo
    }

    [Fact]
    public void Health_business_never_publishes_directly_and_only_goes_live_after_the_admin_approves()
    {
        var business = Business.Create("Clínica", Document.Of("11.222.333/0001-81"), BusinessCategory.Saude);

        DomainException blocked = Assert.Throws<DomainException>(business.Publish);

        Assert.Equal("business.requires_review", blocked.Message);
        Assert.Equal(BusinessStatus.Draft, business.Status);
        Assert.False(business.IsBookable);

        business.Submit();
        Assert.False(business.IsBookable); // em análise: configurável, mas não agendável

        business.Approve();
        Assert.True(business.IsBookable);
    }

    [Fact]
    public void Suspended_business_cannot_be_published_again_and_a_rejected_one_returns_to_draft_with_the_reason()
    {
        Business suspended = NewBusiness();
        suspended.Publish();
        suspended.Suspend(Guid.NewGuid(), "Denúncia procedente.", _now);
        Assert.Throws<DomainException>(suspended.Publish);

        var admin = Guid.NewGuid();
        var clinic = Business.Create("Clínica", Document.Of("11.222.333/0001-81"), BusinessCategory.Saude);
        clinic.Submit();
        clinic.RejectVerification(admin, "Registro do conselho não confere.", _now);
        clinic.ReturnToDraft();

        Assert.Equal(BusinessStatus.Draft, clinic.Status);
        Assert.Equal(VerificationLevel.Rejected, clinic.VerificationLevel);
        Assert.Equal("Registro do conselho não confere.", clinic.VerificationNote);
        Assert.Equal(admin, clinic.VerifiedByUserId);
        clinic.Submit(); // o dono corrige e reenvia
        Assert.Equal(BusinessStatus.PendingReview, clinic.Status);
    }

    [Fact]
    public void Suspension_requires_a_reason_and_records_who_decided_and_when()
    {
        Business business = NewBusiness();
        business.Publish();
        var admin = Guid.NewGuid();

        Assert.Equal("business.suspension_requires_reason", Assert.Throws<DomainException>(() => business.Suspend(admin, "  ", _now)).Message);
        Assert.Equal(BusinessStatus.Active, business.Status);

        business.Suspend(admin, "  Denúncia procedente.  ", _now);

        Assert.Equal(BusinessStatus.Suspended, business.Status);
        Assert.Equal("Denúncia procedente.", business.SuspensionReason);
        Assert.Equal(admin, business.SuspendedByUserId);
        Assert.Equal(_now, business.SuspendedAt);
        Assert.False(business.IsBookable);

        business.Reactivate();
        Assert.True(business.IsBookable);
    }

    [Fact]
    public void Health_responsible_keeps_only_the_council_number_chars_and_an_uppercase_state()
    {
        var clinic = Business.Create("Clínica", Document.Of("11.222.333/0001-81"), BusinessCategory.Saude);
        Assert.False(clinic.HasResponsible);

        clinic.SetResponsible("  Dra. Ana Lima ", ProfessionalCouncil.Crp, "06/12345", "sp");

        Assert.True(clinic.HasResponsible);
        Assert.Equal("Dra. Ana Lima", clinic.ResponsibleName);
        Assert.Equal(ProfessionalCouncil.Crp, clinic.ResponsibleCouncil);
        Assert.Equal("0612345", clinic.ResponsibleCouncilNumber);
        Assert.Equal("SP", clinic.ResponsibleCouncilState);
    }

    [Theory]
    [InlineData("", "123", "SP", "business.responsible_incomplete")]
    [InlineData("Ana", "///", "SP", "business.responsible_incomplete")]
    [InlineData("Ana", "123", "S", "business.responsible_state_invalid")]
    [InlineData("Ana", "123", "S1", "business.responsible_state_invalid")]
    [InlineData("Ana", "123", "SPP", "business.responsible_state_invalid")]
    public void Health_responsible_with_missing_or_malformed_data_is_refused(string name, string number, string state, string code)
    {
        var clinic = Business.Create("Clínica", Document.Of("11.222.333/0001-81"), BusinessCategory.Saude);

        DomainException failure = Assert.Throws<DomainException>(() => clinic.SetResponsible(name, ProfessionalCouncil.Crm, number, state));

        Assert.Equal(code, failure.Message);
        Assert.False(clinic.HasResponsible);
    }

    [Fact]
    public void Terms_record_the_version_and_the_moment()
    {
        Business business = NewBusiness();

        Assert.Throws<DomainException>(() => business.AcceptTerms(" ", _now));

        business.AcceptTerms("2026-11", _now);

        Assert.Equal("2026-11", business.TermsVersion);
        Assert.Equal(_now, business.TermsAcceptedAt);
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

    // ADR-031 substitui o consentimento por perfil: o dono declara a autorização (quem, quando, versão) de quem não tem conta.
    [Fact]
    public void The_owner_declaration_records_who_when_and_which_text_version()
    {
        Professional professional = Professional.Create(Guid.CreateVersion7(), "Ricardo", "Barbeiro", "Bio", null);
        var owner = Guid.CreateVersion7();

        Assert.True(professional.RequiresOwnerDeclaration);
        Assert.False(professional.HasAuthorizationDeclaration);

        professional.DeclareAuthorization(owner, _now);

        Assert.True(professional.HasAuthorizationDeclaration);
        Assert.Equal(owner, professional.AuthorizationDeclaredByUserId);
        Assert.Equal(_now, professional.AuthorizationDeclaredAt);
        Assert.Equal(Professional.AuthorizationDeclarationTextVersion, professional.AuthorizationDeclarationVersion);
    }

    [Fact]
    public void A_professional_with_an_account_does_not_depend_on_the_owner_declaration()
    {
        Professional professional = Professional.Create(Guid.CreateVersion7(), "Ricardo", "Barbeiro", "Bio", Guid.CreateVersion7());

        Assert.False(professional.RequiresOwnerDeclaration);
    }

    [Fact]
    public void The_registration_is_optional_trimmed_and_limited()
    {
        Professional professional = Professional.Create(Guid.CreateVersion7(), "Dra. Ana", "Psicóloga", null, null);

        professional.SetRegistration("  CRP 06/123456  ");
        Assert.Equal("CRP 06/123456", professional.Registration);

        professional.SetRegistration("   ");
        Assert.Null(professional.Registration);

        Assert.Equal(
            "professional.registration_too_long",
            Assert.Throws<DomainException>(() => professional.SetRegistration(new string('1', Professional.MaxRegistrationLength + 1))).Code);
    }

    [Fact]
    public void Deactivating_a_professional_only_takes_them_off_the_showcase()
    {
        Professional professional = Professional.Create(Guid.CreateVersion7(), "Ricardo", "Barbeiro", "Bio", null);

        professional.Deactivate();
        Assert.False(professional.IsActive);

        professional.Activate();
        Assert.True(professional.IsActive);
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
