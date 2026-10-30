using Booking.Arguments.Module.People;
using Booking.Domain.Entity.Base;
using Booking.IntegrationTests.Infrastructure;

namespace Booking.IntegrationTests.People;

/// <summary>
/// Profissional inativo nunca tem perfil completo visível (Onda 7C). O comando de edição aplicava a desativação antes
/// do perfil completo, e um pedido "desativar + perfil completo" deixava o inativo com o perfil ligado.
/// </summary>
[Collection(IntegrationCollection.Name)]
public sealed class ProfessionalVisibilityTests(IntegrationFixture fixture)
{
    private readonly TestWorld _world = new(fixture);

    private async Task<(TestBusiness Business, Guid ProfessionalId)> VisibleProfessionalAsync()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(30)]);
        TestUser staff = await _world.NewStaffAsync(business, professionalIndex: 0);
        Guid professionalId = business.ProfessionalIds[0];

        await _world.SendOkAsync(HttpMethod.Put, $"/api/businesses/current/professionals/{professionalId}/public-profile-consent", null, staff.Token);
        ProfessionalResponse visible = await UpdateAsync(business, professionalId, isActive: true, showFullProfile: true);
        Assert.True(visible.IsPubliclyVisible);

        return (business, professionalId);
    }

    private Task<ProfessionalResponse> UpdateAsync(TestBusiness business, Guid professionalId, bool isActive, bool showFullProfile) =>
        _world.SendOkAsync<ProfessionalResponse>(
            HttpMethod.Put, $"/api/businesses/current/professionals/{professionalId}",
            new UpdateProfessionalRequest("Profissional 1", "Especialidade", "Apresentação", isActive, showFullProfile), business.OwnerToken);

    private async Task<ProfessionalResponse> FromPanelAsync(TestBusiness business, Guid professionalId) =>
        Assert.Single(
            (await _world.SendOkAsync<PagedResult<ProfessionalResponse>>(
                HttpMethod.Get, "/api/businesses/current/professionals", null, business.OwnerToken)).Items,
            p => p.Id == professionalId);

    private async Task<bool> InShowcaseAsync(TestBusiness business, Guid professionalId) =>
        (await _world.SendOkAsync<PagedResult<PublicProfessionalResponse>>(
            HttpMethod.Get, $"/api/businesses/{business.Id}/professionals", null, null!)).Items.Any(p => p.Id == professionalId);

    [Fact]
    public async Task R1_deactivating_with_full_profile_in_the_same_request_hides_the_profile()
    {
        (TestBusiness business, Guid professionalId) = await VisibleProfessionalAsync();

        ProfessionalResponse saved = await UpdateAsync(business, professionalId, isActive: false, showFullProfile: true);

        Assert.False(saved.IsActive);
        Assert.False(saved.IsPubliclyVisible);
        Assert.False((await FromPanelAsync(business, professionalId)).IsPubliclyVisible);
        Assert.False(await InShowcaseAsync(business, professionalId));
    }

    [Fact]
    public async Task R2_full_profile_asked_after_deactivating_stays_hidden_until_reactivated()
    {
        (TestBusiness business, Guid professionalId) = await VisibleProfessionalAsync();

        await UpdateAsync(business, professionalId, isActive: false, showFullProfile: false);
        ProfessionalResponse stillInactive = await UpdateAsync(business, professionalId, isActive: false, showFullProfile: true);

        Assert.False(stillInactive.IsPubliclyVisible);
        Assert.False(await InShowcaseAsync(business, professionalId));

        // Reativado, o consentimento continua valendo e o dono pode ligar o perfil de novo.
        ProfessionalResponse reactivated = await UpdateAsync(business, professionalId, isActive: true, showFullProfile: true);
        Assert.True(reactivated.IsPubliclyVisible);
        Assert.True(await InShowcaseAsync(business, professionalId));
    }
}
