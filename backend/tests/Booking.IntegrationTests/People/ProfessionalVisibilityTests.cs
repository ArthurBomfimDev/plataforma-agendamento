using System.Net;
using Booking.Arguments.Module.People;
using Booking.Domain.Entity.Base;
using Booking.IntegrationTests.Infrastructure;

namespace Booking.IntegrationTests.People;

/// <summary>
/// Perfil público sempre ligado (Fase 4, bloco 3, ADR-031): todo profissional ativo aparece na vitrine com especialidade e
/// bio; inativo sai dela; salvar a bio de quem não tem conta exige a declaração do dono. Substitui os testes do
/// consentimento por perfil (R1 e R2 da Onda 7C). ESCRITOS SEM DOCKER: ainda não foram rodados.
/// </summary>
[Collection(IntegrationCollection.Name)]
public sealed class ProfessionalVisibilityTests(IntegrationFixture fixture)
{
    private readonly TestWorld _world = new(fixture);

    private Task<ProfessionalResponse> UpdateAsync(TestBusiness business, Guid professionalId, bool isActive, bool declared) =>
        _world.SendOkAsync<ProfessionalResponse>(
            HttpMethod.Put, $"/api/businesses/current/professionals/{professionalId}",
            new UpdateProfessionalRequest("Profissional 1", "Especialidade", "Apresentação", isActive, declared), business.OwnerToken);

    private async Task<PublicProfessionalResponse?> InShowcaseAsync(TestBusiness business, Guid professionalId) =>
        (await _world.SendOkAsync<PagedResult<PublicProfessionalResponse>>(
            HttpMethod.Get, $"/api/businesses/{business.Id}/professionals", null, null!)).Items.SingleOrDefault(p => p.Id == professionalId);

    [Fact]
    public async Task R1_an_active_professional_shows_specialty_and_bio_to_everyone_with_the_owner_declaration()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(30)]);
        Guid professionalId = business.ProfessionalIds[0];

        ProfessionalResponse saved = await UpdateAsync(business, professionalId, isActive: true, declared: true);

        Assert.True(saved.AuthorizationDeclared);
        PublicProfessionalResponse? shown = await InShowcaseAsync(business, professionalId);
        Assert.Equal("Especialidade", shown?.Specialty);
        Assert.Equal("Apresentação", shown?.Bio);
    }

    [Fact]
    public async Task R2_saving_a_bio_of_someone_without_an_account_needs_the_declaration()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(30)]);
        Guid professionalId = business.ProfessionalIds[0];

        using HttpResponseMessage refused = await _world.SendAsync(
            HttpMethod.Put, $"/api/businesses/current/professionals/{professionalId}",
            new UpdateProfessionalRequest("Profissional 1", "Especialidade", "Apresentação", true, false), business.OwnerToken);

        Assert.Equal(HttpStatusCode.BadRequest, refused.StatusCode);
        Assert.Equal("professional.declaration_required", await TestWorld.ErrorCodeAsync(refused));
        Assert.Null((await InShowcaseAsync(business, professionalId))?.Bio);
    }

    [Fact]
    public async Task R3_deactivating_takes_the_professional_off_the_showcase_and_reactivating_brings_them_back()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(30)]);
        Guid professionalId = business.ProfessionalIds[0];
        await UpdateAsync(business, professionalId, isActive: true, declared: true);

        await UpdateAsync(business, professionalId, isActive: false, declared: false);
        Assert.Null(await InShowcaseAsync(business, professionalId));

        // A declaração fica registrada: reativar não pede de novo.
        await UpdateAsync(business, professionalId, isActive: true, declared: false);
        Assert.NotNull(await InShowcaseAsync(business, professionalId));
    }

    [Fact]
    public async Task R4_whoever_has_an_account_edits_the_own_bio_and_it_is_public_without_any_declaration()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(30)]);
        TestUser staff = await _world.NewStaffAsync(business, professionalIndex: 0);
        Guid professionalId = business.ProfessionalIds[0];

        await _world.SendOkAsync<ProfessionalResponse>(
            HttpMethod.Put, "/api/businesses/current/professionals/me", new UpdateMyProfessionalProfileRequest("Barbeiro", "Cortes há 10 anos.", null), staff.Token);

        Assert.Equal("Cortes há 10 anos.", (await InShowcaseAsync(business, professionalId))?.Bio);
    }

    [Fact]
    public async Task R5_the_consent_routes_no_longer_exist()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(30)]);
        TestUser staff = await _world.NewStaffAsync(business, professionalIndex: 0);

        using HttpResponseMessage response = await _world.SendAsync(
            HttpMethod.Put, $"/api/businesses/current/professionals/{business.ProfessionalIds[0]}/public-profile-consent", null, staff.Token);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
