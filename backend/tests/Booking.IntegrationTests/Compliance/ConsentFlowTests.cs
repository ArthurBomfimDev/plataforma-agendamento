using System.Net;
using Booking.Arguments.Module.Compliance;
using Booking.Domain.Entity.Base;
using Booking.IntegrationTests.Infrastructure;

namespace Booking.IntegrationTests.Compliance;

/// <summary>
/// O caminho que a tela "Revise seu pedido" e "Minha conta" fazem: recusa sem consentimento, grava com a versão vigente,
/// agenda, revoga e volta a recusar (LGPD, Art. 11).
/// </summary>
[Collection(IntegrationCollection.Name)]
public sealed class ConsentFlowTests(IntegrationFixture fixture)
{
    private readonly TestWorld _world = new(fixture);

    private async Task<HttpResponseMessage> RequestAsync(TestUser customer, TestBusiness clinic, int hour) =>
        await _world.Client.SendAsync(_world.RequestAppointment(customer, clinic, clinic.Services[0], clinic.ProfessionalIds[0], TestCalendar.At(hour)));

    [Fact]
    public async Task C1_consent_is_recorded_with_the_current_version_and_revoking_blocks_again()
    {
        TestBusiness clinic = await _world.NewBusinessAsync(1, [new ServiceSpec(60)], category: "Saude");
        TestUser customer = await _world.NewCustomerAsync();

        using (HttpResponseMessage refused = await RequestAsync(customer, clinic, 9))
        {
            Assert.Equal(HttpStatusCode.Forbidden, refused.StatusCode);
            Assert.Equal("compliance.consent_required", await TestWorld.ErrorCodeAsync(refused));
        }

        ConsentVersionsResponse versions = await _world.SendOkAsync<ConsentVersionsResponse>(HttpMethod.Get, "/api/consents/versions", null, null!);
        Assert.Equal("2026-10-v1", versions.SensitiveScheduling);
        Assert.Contains("Art. 11", versions.SensitiveSchedulingText);

        ConsentResponse granted = await _world.SendOkAsync<ConsentResponse>(
            HttpMethod.Post, "/api/consents", new GrantConsentRequest("SensitiveScheduling", versions.SensitiveScheduling), customer.Token);
        Assert.Equal("2026-10-v1", granted.Version);
        Assert.Null(granted.RevokedAt);

        using (HttpResponseMessage accepted = await RequestAsync(customer, clinic, 10))
        {
            Assert.Equal(HttpStatusCode.Created, accepted.StatusCode);
        }

        using (HttpResponseMessage revoked = await _world.SendAsync(HttpMethod.Delete, "/api/consents/SensitiveScheduling", null, customer.Token))
        {
            Assert.Equal(HttpStatusCode.NoContent, revoked.StatusCode);
        }

        PagedResult<ConsentResponse> mine = await _world.SendOkAsync<PagedResult<ConsentResponse>>(HttpMethod.Get, "/api/consents", null, customer.Token);
        Assert.NotNull(Assert.Single(mine.Items).RevokedAt);

        using HttpResponseMessage blocked = await RequestAsync(customer, clinic, 11);
        Assert.Equal(HttpStatusCode.Forbidden, blocked.StatusCode);
        Assert.Equal("compliance.consent_required", await TestWorld.ErrorCodeAsync(blocked));
    }

    [Fact]
    public async Task C2_a_version_other_than_the_current_one_is_refused()
    {
        TestUser customer = await _world.NewCustomerAsync();

        using HttpResponseMessage outdated = await _world.SendAsync(
            HttpMethod.Post, "/api/consents", new GrantConsentRequest("SensitiveScheduling", "2020-01-v0"), customer.Token);

        Assert.Equal(HttpStatusCode.BadRequest, outdated.StatusCode);
        Assert.Equal("consent.version_outdated", await TestWorld.ErrorCodeAsync(outdated));
    }
}
